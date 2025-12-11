"""Serializers for Terraform models."""
from rest_framework import serializers
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
from django.core.exceptions import ValidationError


class GitBranchSerializer(serializers.ModelSerializer):
    """Serializer for GitBranch model."""

    class Meta:
        model = GitBranch
        fields = [
            'id', 'project', 'name', 'is_default',
            'last_commit_hash', 'last_commit_message',
            'last_commit_author', 'last_commit_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CloudProviderCredentialSerializer(serializers.ModelSerializer):
    """
    Serializer for CloudProviderCredential model.

    SECURITY: Never returns raw credential values. All sensitive fields are masked.
    Credentials can only be written, never read back in plaintext.
    """

    # Write-only fields for credential input (AWS)
    aws_access_key_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    aws_secret_access_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    aws_session_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Write-only fields for credential input (Azure)
    azure_subscription_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    azure_tenant_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    azure_client_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    azure_client_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Write-only fields for credential input (GCP)
    gcp_project_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gcp_service_account_json = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Write-only field for generic credentials
    generic_credentials = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Read-only fields to indicate if credentials are set (without exposing values)
    has_aws_credentials = serializers.SerializerMethodField()
    has_azure_credentials = serializers.SerializerMethodField()
    has_gcp_credentials = serializers.SerializerMethodField()
    has_generic_credentials = serializers.SerializerMethodField()

    class Meta:
        model = CloudProviderCredential
        fields = [
            'id', 'user', 'name', 'description', 'provider_type',
            # AWS fields (write-only)
            'aws_access_key_id', 'aws_secret_access_key', 'aws_session_token', 'aws_region',
            # Azure fields (write-only)
            'azure_subscription_id', 'azure_tenant_id', 'azure_client_id', 'azure_client_secret',
            # GCP fields (write-only)
            'gcp_project_id', 'gcp_service_account_json',
            # Generic fields (write-only)
            'generic_credentials',
            # Status fields (read-only)
            'has_aws_credentials', 'has_azure_credentials', 'has_gcp_credentials', 'has_generic_credentials',
            'is_default', 'metadata', 'is_valid', 'last_used_at', 'last_validated_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'has_aws_credentials', 'has_azure_credentials',
            'has_gcp_credentials', 'has_generic_credentials', 'last_used_at',
            'last_validated_at', 'created_at', 'updated_at'
        ]

    def get_has_aws_credentials(self, obj):
        """Check if AWS credentials are set."""
        return bool(obj._aws_access_key_id and obj._aws_secret_access_key)

    def get_has_azure_credentials(self, obj):
        """Check if Azure credentials are set."""
        return bool(obj._azure_subscription_id and obj._azure_tenant_id and obj._azure_client_id)

    def get_has_gcp_credentials(self, obj):
        """Check if GCP credentials are set."""
        return bool(obj._gcp_project_id or obj._gcp_service_account_json)

    def get_has_generic_credentials(self, obj):
        """Check if generic credentials are set."""
        return bool(obj._generic_credentials)

    def create(self, validated_data):
        """Create credential with encrypted fields."""
        # Extract credential fields
        aws_access_key = validated_data.pop('aws_access_key_id', None)
        aws_secret_key = validated_data.pop('aws_secret_access_key', None)
        aws_session = validated_data.pop('aws_session_token', None)

        azure_subscription = validated_data.pop('azure_subscription_id', None)
        azure_tenant = validated_data.pop('azure_tenant_id', None)
        azure_client = validated_data.pop('azure_client_id', None)
        azure_secret = validated_data.pop('azure_client_secret', None)

        gcp_project = validated_data.pop('gcp_project_id', None)
        gcp_json = validated_data.pop('gcp_service_account_json', None)

        generic = validated_data.pop('generic_credentials', None)

        # Set user from request
        validated_data['user'] = self.context['request'].user

        # Create instance
        instance = CloudProviderCredential.objects.create(**validated_data)

        # Set credentials using properties (which encrypt automatically)
        if aws_access_key:
            instance.aws_access_key_id = aws_access_key
        if aws_secret_key:
            instance.aws_secret_access_key = aws_secret_key
        if aws_session:
            instance.aws_session_token = aws_session

        if azure_subscription:
            instance.azure_subscription_id = azure_subscription
        if azure_tenant:
            instance.azure_tenant_id = azure_tenant
        if azure_client:
            instance.azure_client_id = azure_client
        if azure_secret:
            instance.azure_client_secret = azure_secret

        if gcp_project:
            instance.gcp_project_id = gcp_project
        if gcp_json:
            instance.gcp_service_account_json = gcp_json

        if generic:
            instance.generic_credentials = generic

        instance.save()
        return instance

    def update(self, instance, validated_data):
        """Update credential with encrypted fields."""
        # Extract and update credential fields
        aws_access_key = validated_data.pop('aws_access_key_id', None)
        aws_secret_key = validated_data.pop('aws_secret_access_key', None)
        aws_session = validated_data.pop('aws_session_token', None)

        azure_subscription = validated_data.pop('azure_subscription_id', None)
        azure_tenant = validated_data.pop('azure_tenant_id', None)
        azure_client = validated_data.pop('azure_client_id', None)
        azure_secret = validated_data.pop('azure_client_secret', None)

        gcp_project = validated_data.pop('gcp_project_id', None)
        gcp_json = validated_data.pop('gcp_service_account_json', None)

        generic = validated_data.pop('generic_credentials', None)

        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update credentials using properties (which encrypt automatically)
        if aws_access_key is not None:
            instance.aws_access_key_id = aws_access_key
        if aws_secret_key is not None:
            instance.aws_secret_access_key = aws_secret_key
        if aws_session is not None:
            instance.aws_session_token = aws_session

        if azure_subscription is not None:
            instance.azure_subscription_id = azure_subscription
        if azure_tenant is not None:
            instance.azure_tenant_id = azure_tenant
        if azure_client is not None:
            instance.azure_client_id = azure_client
        if azure_secret is not None:
            instance.azure_client_secret = azure_secret

        if gcp_project is not None:
            instance.gcp_project_id = gcp_project
        if gcp_json is not None:
            instance.gcp_service_account_json = gcp_json

        if generic is not None:
            instance.generic_credentials = generic

        instance.save()
        return instance


class CloudProviderCredentialListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing credentials (no sensitive fields at all)."""

    has_credentials = serializers.SerializerMethodField()

    class Meta:
        model = CloudProviderCredential
        fields = [
            'id', 'name', 'description', 'provider_type',
            'aws_region', 'is_default', 'is_valid',
            'has_credentials', 'last_validated_at', 'created_at'
        ]
        read_only_fields = fields

    def get_has_credentials(self, obj):
        """Check if any credentials are set."""
        return bool(
            obj._aws_access_key_id or obj._azure_subscription_id or
            obj._gcp_project_id or obj._generic_credentials
        )


class TerraformProviderSerializer(serializers.ModelSerializer):
    """Serializer for TerraformProvider model."""

    credential_name = serializers.CharField(source='credential.name', read_only=True, allow_null=True)
    credential_provider_type = serializers.CharField(source='credential.provider_type', read_only=True, allow_null=True)

    class Meta:
        model = TerraformProvider
        fields = [
            'id', 'project', 'name', 'alias', 'version',
            'credential', 'credential_name', 'credential_provider_type',
            'region', 'configuration',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'credential_name', 'credential_provider_type', 'created_at', 'updated_at']


class TerraformModuleSerializer(serializers.ModelSerializer):
    """Serializer for TerraformModule model."""

    child_modules = serializers.SerializerMethodField()

    class Meta:
        model = TerraformModule
        fields = [
            'id', 'project', 'parent_module', 'name',
            'source', 'version', 'path', 'metadata',
            'child_modules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_child_modules(self, obj):
        """Get child modules recursively."""
        children = obj.child_modules.all()
        return TerraformModuleSerializer(children, many=True).data


class TerraformResourceSerializer(serializers.ModelSerializer):
    """Serializer for TerraformResource model."""

    dependencies_from = serializers.SerializerMethodField()
    dependencies_to = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='provider.name', read_only=True, allow_null=True)

    # Hierarchy fields
    parent_resource_name = serializers.CharField(source='parent_resource.resource_name', read_only=True, allow_null=True)
    parent_resource_type = serializers.CharField(source='parent_resource.resource_type', read_only=True, allow_null=True)
    contained_resources_count = serializers.SerializerMethodField()
    hierarchy_path = serializers.SerializerMethodField()
    is_container = serializers.ReadOnlyField()
    can_have_parent = serializers.ReadOnlyField()

    class Meta:
        model = TerraformResource
        fields = [
            'id', 'project', 'module', 'provider', 'provider_name',
            'resource_type', 'resource_name', 'terraform_address',
            'configuration', 'metadata', 'status', 'state_id',
            'is_data_source',
            # Hierarchy fields
            'parent_resource', 'parent_resource_name', 'parent_resource_type',
            'contained_resources_count', 'hierarchy_path',
            'is_container', 'can_have_parent', 'availability_zone',
            # Dependencies
            'dependencies_from', 'dependencies_to',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'parent_resource_name', 'parent_resource_type',
            'contained_resources_count', 'hierarchy_path',
            'is_container', 'can_have_parent',
            'created_at', 'updated_at'
        ]

    def get_dependencies_from(self, obj):
        """Get resources this resource depends on."""
        deps = obj.dependencies_from.all()
        return [{
            'id': dep.id,
            'to_resource_id': dep.to_resource_id,
            'terraform_address': dep.to_resource.terraform_address,
            'dependency_type': dep.dependency_type
        } for dep in deps]

    def get_dependencies_to(self, obj):
        """Get resources that depend on this resource."""
        deps = obj.dependencies_to.all()
        return [{
            'id': dep.id,
            'from_resource_id': dep.from_resource_id,
            'terraform_address': dep.from_resource.terraform_address,
            'dependency_type': dep.dependency_type
        } for dep in deps]

    def get_contained_resources_count(self, obj):
        """Get count of resources contained by this resource."""
        return obj.contained_resources.count()

    def get_hierarchy_path(self, obj):
        """Get full hierarchy path."""
        return obj.get_hierarchy_path()

    def validate(self, attrs):
        """Validate parent-child relationships."""
        # Create a temporary instance for validation
        instance = TerraformResource(**attrs)
        if self.instance:
            instance.id = self.instance.id

        # Run model validation
        try:
            instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else str(e))

        return attrs

    def create(self, validated_data):
        """Create resource and add default egress rule for security groups."""
        # Check if this is a security group
        is_security_group = validated_data.get('resource_type') == 'aws_security_group'

        # Create the resource
        instance = super().create(validated_data)

        # Add default egress rule for security groups if none specified
        if is_security_group:
            configuration = instance.configuration or {}

            # Only add default egress if no egress rules are specified
            if 'egress' not in configuration or not configuration['egress']:
                configuration['egress'] = [{
                    'protocol': '-1',
                    'cidr_blocks': ['0.0.0.0/0'],
                    'description': 'Allow all outbound traffic (AWS default)'
                }]
                instance.configuration = configuration
                instance.save()

        return instance


class ResourceDependencySerializer(serializers.ModelSerializer):
    """Serializer for ResourceDependency model."""

    from_resource_address = serializers.CharField(source='from_resource.terraform_address', read_only=True)
    to_resource_address = serializers.CharField(source='to_resource.terraform_address', read_only=True)

    class Meta:
        model = ResourceDependency
        fields = [
            'id', 'from_resource', 'to_resource',
            'from_resource_address', 'to_resource_address',
            'dependency_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TerraformVariableSerializer(serializers.ModelSerializer):
    """Serializer for TerraformVariable model."""

    class Meta:
        model = TerraformVariable
        fields = [
            'id', 'project', 'module', 'name', 'type',
            'description', 'default_value', 'value',
            'sensitive', 'validation_rules',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Hide sensitive values."""
        data = super().to_representation(instance)
        if instance.sensitive and data.get('value'):
            data['value'] = '***SENSITIVE***'
        return data


class TerraformOutputSerializer(serializers.ModelSerializer):
    """Serializer for TerraformOutput model."""

    class Meta:
        model = TerraformOutput
        fields = [
            'id', 'project', 'module', 'name',
            'description', 'value', 'sensitive',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Hide sensitive values."""
        data = super().to_representation(instance)
        if instance.sensitive and data.get('value'):
            data['value'] = '***SENSITIVE***'
        return data


class TerraformStateFileSerializer(serializers.ModelSerializer):
    """Serializer for TerraformStateFile model."""

    class Meta:
        model = TerraformStateFile
        fields = [
            'id', 'project', 'branch', 'version',
            'terraform_version', 'serial', 'lineage',
            'state_data', 'resources_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TerraformExecutionSerializer(serializers.ModelSerializer):
    """Serializer for TerraformExecution model."""

    initiated_by_email = serializers.EmailField(source='initiated_by.email', read_only=True)
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TerraformExecution
        fields = [
            'id', 'project', 'branch', 'execution_type', 'status',
            'initiated_by', 'initiated_by_email',
            'started_at', 'completed_at', 'duration_seconds',
            'plan_output', 'changes_summary', 'logs',
            'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_duration_seconds(self, obj):
        """Calculate execution duration in seconds."""
        if obj.started_at and obj.completed_at:
            delta = obj.completed_at - obj.started_at
            return delta.total_seconds()
        return None


class ResourceCloudStatusSerializer(serializers.ModelSerializer):
    """Serializer for ResourceCloudStatus model."""

    resource_address = serializers.CharField(source='resource.terraform_address', read_only=True)

    class Meta:
        model = ResourceCloudStatus
        fields = [
            'id', 'resource', 'resource_address',
            'cloud_resource_id', 'status', 'ip_address',
            'url', 'cost_per_hour', 'metadata',
            'last_checked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TerraformProjectSerializer(serializers.ModelSerializer):
    """Serializer for TerraformProject model."""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    resources_count = serializers.SerializerMethodField()
    branches_count = serializers.SerializerMethodField()

    # Template fields (write-only, only for creation)
    template = serializers.CharField(write_only=True, required=False, allow_blank=True)
    template_options = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = TerraformProject
        fields = [
            'id', 'user', 'user_email', 'name', 'description',
            'git_repository_url', 'git_branch', 'git_commit_hash',
            'terraform_version', 'metadata',
            'resources_count', 'branches_count',
            'template', 'template_options',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_resources_count(self, obj):
        """Get count of resources in project."""
        return obj.resources.count()

    def get_branches_count(self, obj):
        """Get count of branches in project."""
        return obj.git_branches.count()


class TerraformProjectDetailSerializer(TerraformProjectSerializer):
    """Detailed serializer for TerraformProject with nested data."""

    providers = TerraformProviderSerializer(many=True, read_only=True)
    modules = TerraformModuleSerializer(many=True, read_only=True)
    resources = TerraformResourceSerializer(many=True, read_only=True)
    variables = TerraformVariableSerializer(many=True, read_only=True)
    outputs = TerraformOutputSerializer(many=True, read_only=True)
    git_branches = GitBranchSerializer(many=True, read_only=True)
    executions = serializers.SerializerMethodField()

    class Meta(TerraformProjectSerializer.Meta):
        fields = TerraformProjectSerializer.Meta.fields + [
            'providers', 'modules', 'resources',
            'variables', 'outputs', 'git_branches', 'executions'
        ]

    def get_executions(self, obj):
        """Get recent executions (last 10)."""
        executions = obj.executions.all()[:10]
        return TerraformExecutionSerializer(executions, many=True).data
