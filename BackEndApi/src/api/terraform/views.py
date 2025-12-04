"""ViewSets for Terraform API endpoints."""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from django.utils import timezone

from .models import (
    TerraformProject,
    GitBranch,
    CloudProviderCredential,
    TerraformProvider,
    TerraformModule,
    TerraformResource,
    ResourceDependency,
    TerraformVariable,
    TerraformOutput,
    TerraformStateFile,
    TerraformExecution,
    ResourceCloudStatus,
)
from .serializers import (
    TerraformProjectSerializer,
    TerraformProjectDetailSerializer,
    GitBranchSerializer,
    CloudProviderCredentialSerializer,
    CloudProviderCredentialListSerializer,
    TerraformProviderSerializer,
    TerraformModuleSerializer,
    TerraformResourceSerializer,
    ResourceDependencySerializer,
    TerraformVariableSerializer,
    TerraformOutputSerializer,
    TerraformStateFileSerializer,
    TerraformExecutionSerializer,
    ResourceCloudStatusSerializer,
)
from .services import HCLParser, GitService


class TerraformProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform projects."""

    queryset = TerraformProject.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return TerraformProjectDetailSerializer
        return TerraformProjectSerializer

    def get_queryset(self):
        """Filter projects by current user."""
        return TerraformProject.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Set user to current user on create."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def parse_hcl(self, request, pk=None):
        """Parse Terraform HCL files in the project."""
        project = self.get_object()

        # TODO: Implement project directory management
        # For now, return placeholder
        return Response({
            'status': 'success',
            'message': 'HCL parsing will be implemented with file storage'
        })

    @action(detail=True, methods=['post'])
    def clone_repository(self, request, pk=None):
        """Clone a Git repository for this project."""
        project = self.get_object()

        repo_url = request.data.get('repo_url')
        branch = request.data.get('branch', 'main')

        if not repo_url:
            return Response(
                {'error': 'repo_url is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Implement with project storage directory
        return Response({
            'status': 'success',
            'message': 'Repository cloning will be implemented with file storage'
        })


class GitBranchViewSet(viewsets.ModelViewSet):
    """ViewSet for Git branches."""

    queryset = GitBranch.objects.all()
    serializer_class = GitBranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'is_default']
    search_fields = ['name']
    ordering = ['-is_default', 'name']

    def get_queryset(self):
        """Filter branches by user's projects."""
        return GitBranch.objects.filter(project__user=self.request.user)


class CloudProviderCredentialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for cloud provider credentials.

    SECURITY: Only shows credentials owned by the current user.
    Never returns raw credential values in responses.
    """

    queryset = CloudProviderCredential.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provider_type', 'is_default', 'is_valid']
    search_fields = ['name', 'description']
    ordering = ['-is_default', 'name']

    def get_serializer_class(self):
        """Use lightweight serializer for list action."""
        if self.action == 'list':
            return CloudProviderCredentialListSerializer
        return CloudProviderCredentialSerializer

    def get_queryset(self):
        """Filter credentials by current user."""
        return CloudProviderCredential.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def validate_credentials(self, request, pk=None):
        """
        Validate cloud provider credentials by making a test API call.

        For AWS: Attempts to get caller identity using STS.
        For Azure/GCP: To be implemented.
        """
        credential = self.get_object()

        if credential.provider_type == 'aws':
            return self._validate_aws_credentials(credential)
        elif credential.provider_type == 'azure':
            return Response({
                'valid': False,
                'message': 'Azure validation not yet implemented'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
        elif credential.provider_type == 'gcp':
            return Response({
                'valid': False,
                'message': 'GCP validation not yet implemented'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
        else:
            return Response({
                'valid': False,
                'message': f'Validation not supported for provider type: {credential.provider_type}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def _validate_aws_credentials(self, credential):
        """Validate AWS credentials using STS GetCallerIdentity."""
        try:
            # Get decrypted credentials
            access_key = credential.aws_access_key_id
            secret_key = credential.aws_secret_access_key
            session_token = credential.aws_session_token or None

            if not access_key or not secret_key:
                return Response({
                    'valid': False,
                    'message': 'AWS credentials not set'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create boto3 client with credentials
            sts_client = boto3.client(
                'sts',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                aws_session_token=session_token,
                region_name=credential.aws_region or 'us-east-1'
            )

            # Test credentials by calling GetCallerIdentity
            identity = sts_client.get_caller_identity()

            # Update credential status
            credential.is_valid = True
            credential.last_validated_at = timezone.now()
            credential.save()

            return Response({
                'valid': True,
                'message': 'AWS credentials are valid',
                'identity': {
                    'account': identity.get('Account'),
                    'user_id': identity.get('UserId'),
                    'arn': identity.get('Arn')
                }
            })

        except NoCredentialsError:
            credential.is_valid = False
            credential.last_validated_at = timezone.now()
            credential.save()

            return Response({
                'valid': False,
                'message': 'No AWS credentials found'
            }, status=status.HTTP_400_BAD_REQUEST)

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))

            credential.is_valid = False
            credential.last_validated_at = timezone.now()
            credential.save()

            return Response({
                'valid': False,
                'message': f'AWS API error: {error_code} - {error_message}',
                'error_code': error_code
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            credential.is_valid = False
            credential.last_validated_at = timezone.now()
            credential.save()

            return Response({
                'valid': False,
                'message': f'Validation error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'])
    def set_default(self, request, pk=None):
        """Set this credential as the default for its provider type."""
        credential = self.get_object()

        # Remove default flag from other credentials of the same type
        CloudProviderCredential.objects.filter(
            user=request.user,
            provider_type=credential.provider_type,
            is_default=True
        ).exclude(id=credential.id).update(is_default=False)

        # Set this credential as default
        credential.is_default = True
        credential.save()

        return Response({
            'message': f'{credential.name} set as default {credential.provider_type} credential'
        })


class TerraformProviderViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform providers."""

    queryset = TerraformProvider.objects.all()
    serializer_class = TerraformProviderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'name']
    search_fields = ['name', 'alias']
    ordering = ['name']

    def get_queryset(self):
        """Filter providers by user's projects."""
        return TerraformProvider.objects.filter(project__user=self.request.user)


class TerraformModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform modules."""

    queryset = TerraformModule.objects.all()
    serializer_class = TerraformModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'parent_module']
    search_fields = ['name', 'source']
    ordering = ['name']

    def get_queryset(self):
        """Filter modules by user's projects."""
        return TerraformModule.objects.filter(project__user=self.request.user)


class TerraformResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform resources."""

    queryset = TerraformResource.objects.all()
    serializer_class = TerraformResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'module', 'provider', 'resource_type', 'status']
    search_fields = ['resource_name', 'resource_type', 'terraform_address']
    ordering = ['resource_type', 'resource_name']

    def get_queryset(self):
        """Filter resources by user's projects."""
        return TerraformResource.objects.filter(project__user=self.request.user)

    @action(detail=True, methods=['get'])
    def dependencies(self, request, pk=None):
        """Get dependencies for a specific resource."""
        resource = self.get_object()

        dependencies_from = ResourceDependencySerializer(
            resource.dependencies_from.all(),
            many=True
        ).data

        dependencies_to = ResourceDependencySerializer(
            resource.dependencies_to.all(),
            many=True
        ).data

        return Response({
            'dependencies_from': dependencies_from,
            'dependencies_to': dependencies_to
        })


class ResourceDependencyViewSet(viewsets.ModelViewSet):
    """ViewSet for resource dependencies."""

    queryset = ResourceDependency.objects.all()
    serializer_class = ResourceDependencySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['from_resource', 'to_resource', 'dependency_type']

    def get_queryset(self):
        """Filter dependencies by user's projects."""
        return ResourceDependency.objects.filter(
            from_resource__project__user=self.request.user
        )


class TerraformVariableViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform variables."""

    queryset = TerraformVariable.objects.all()
    serializer_class = TerraformVariableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'module', 'sensitive']
    search_fields = ['name', 'description']
    ordering = ['name']

    def get_queryset(self):
        """Filter variables by user's projects."""
        return TerraformVariable.objects.filter(project__user=self.request.user)


class TerraformOutputViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform outputs."""

    queryset = TerraformOutput.objects.all()
    serializer_class = TerraformOutputSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'module', 'sensitive']
    search_fields = ['name', 'description']
    ordering = ['name']

    def get_queryset(self):
        """Filter outputs by user's projects."""
        return TerraformOutput.objects.filter(project__user=self.request.user)


class TerraformStateFileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Terraform state files (read-only)."""

    queryset = TerraformStateFile.objects.all()
    serializer_class = TerraformStateFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['project', 'branch']
    ordering = ['-version', '-created_at']

    def get_queryset(self):
        """Filter state files by user's projects."""
        return TerraformStateFile.objects.filter(project__user=self.request.user)


class TerraformExecutionViewSet(viewsets.ModelViewSet):
    """ViewSet for Terraform executions."""

    queryset = TerraformExecution.objects.all()
    serializer_class = TerraformExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['project', 'branch', 'execution_type', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter executions by user's projects."""
        return TerraformExecution.objects.filter(project__user=self.request.user)

    def perform_create(self, serializer):
        """Set initiated_by to current user on create."""
        serializer.save(initiated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running execution."""
        execution = self.get_object()

        if execution.status != 'running':
            return Response(
                {'error': 'Only running executions can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        execution.status = 'cancelled'
        execution.save()

        return Response({
            'status': 'success',
            'message': 'Execution cancelled'
        })


class ResourceCloudStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for resource cloud status."""

    queryset = ResourceCloudStatus.objects.all()
    serializer_class = ResourceCloudStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['resource', 'status']
    ordering = ['-last_checked_at']

    def get_queryset(self):
        """Filter cloud status by user's projects."""
        return ResourceCloudStatus.objects.filter(
            resource__project__user=self.request.user
        )

    @action(detail=False, methods=['post'])
    def refresh_all(self, request):
        """Refresh cloud status for all resources."""
        # TODO: Implement cloud provider status refresh
        return Response({
            'status': 'success',
            'message': 'Cloud status refresh will be implemented in Phase 3'
        })
