"""
Terraform project templates.

Templates provide pre-configured infrastructure setups that create
providers, resources, and variables when a project is created.
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any
from ..models import TerraformProject, TerraformProvider, TerraformResource, CloudProviderCredential


class BaseTemplate(ABC):
    """Base class for all project templates."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Template name (e.g., 'aws', 'azure')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable name (e.g., 'AWS Standard Setup')."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Template description for UI."""
        pass

    @abstractmethod
    def create(self, project: TerraformProject, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create template resources for the project.

        Args:
            project: The TerraformProject instance
            options: Optional configuration (e.g., {'region': 'us-west-2', 'credential_id': 'uuid'})

        Returns:
            Dict with created objects:
            {
                'providers': [TerraformProvider, ...],
                'resources': [TerraformResource, ...],
                'variables': [TerraformVariable, ...],
            }
        """
        pass


class BlankTemplate(BaseTemplate):
    """Empty template - no resources created."""

    @property
    def name(self) -> str:
        return 'blank'

    @property
    def display_name(self) -> str:
        return 'Blank Project'

    @property
    def description(self) -> str:
        return 'Start from scratch with an empty project'

    def create(self, project: TerraformProject, options: Dict[str, Any] = None) -> Dict[str, Any]:
        return {'providers': [], 'resources': [], 'variables': []}


class AWSTemplate(BaseTemplate):
    """
    AWS template with:
    - AWS provider with credentials
    - AWS Account container resource
    - Default VPC data source
    - Default subnet data sources (in each AZ)
    """

    @property
    def name(self) -> str:
        return 'aws'

    @property
    def display_name(self) -> str:
        return 'AWS Standard Setup'

    @property
    def description(self) -> str:
        return 'AWS provider with default VPC and subnets (data sources)'

    def create(self, project: TerraformProject, options: Dict[str, Any] = None) -> Dict[str, Any]:
        options = options or {}
        region = options.get('region', 'us-east-1')
        credential_id = options.get('credential_id')

        # Get credential if provided
        credential = None
        if credential_id:
            try:
                credential = CloudProviderCredential.objects.get(
                    id=credential_id,
                    user=project.user,
                    provider_type='aws'
                )
            except CloudProviderCredential.DoesNotExist:
                pass

        created = {'providers': [], 'resources': [], 'variables': []}

        # 1. Create AWS Provider
        provider = TerraformProvider.objects.create(
            project=project,
            name='aws',
            version='~> 5.0',
            region=region,
            credential=credential,
            configuration={
                'region': region,
            }
        )
        created['providers'].append(provider)

        # 2. Create AWS Account container (organizational, not actual Terraform resource)
        aws_account = TerraformResource.objects.create(
            project=project,
            provider=provider,
            resource_type='aws_account',
            resource_name='main',
            terraform_address='aws_account.main',
            configuration={
                'account_type': 'container',
                'description': 'AWS Account container',
            },
            metadata={
                'position': {'x': 100, 'y': 100},
                'isOrganizational': True,  # Flag for UI: don't generate HCL
            },
            status='created',
            is_data_source=False,
        )
        created['resources'].append(aws_account)

        # 3. Create data source for default VPC
        default_vpc = TerraformResource.objects.create(
            project=project,
            provider=provider,
            parent_resource=aws_account,  # Inside AWS account
            resource_type='aws_vpc',
            resource_name='default',
            terraform_address='data.aws_vpc.default',
            configuration={
                'default': True,
            },
            metadata={
                'position': {'x': 150, 'y': 250},
            },
            status='created',
            is_data_source=True,  # This is a data source!
        )
        created['resources'].append(default_vpc)

        # 4. Create data sources for default subnets
        # Note: In real use, user would configure how many AZs, but for template we create 3
        availability_zones = [f"{region}a", f"{region}b", f"{region}c"]

        for i, az in enumerate(availability_zones):
            subnet = TerraformResource.objects.create(
                project=project,
                provider=provider,
                parent_resource=default_vpc,  # Inside VPC
                resource_type='aws_subnet',
                resource_name=f'default_{az.replace("-", "_")}',
                terraform_address=f'data.aws_subnet.default_{az.replace("-", "_")}',
                configuration={
                    'availability_zone': az,
                    'default_for_az': True,
                    'vpc_id': '${data.aws_vpc.default.id}',  # Reference
                },
                metadata={
                    'position': {'x': 200 + (i * 200), 'y': 400},
                },
                availability_zone=az,
                status='created',
                is_data_source=True,
            )
            created['resources'].append(subnet)

        return created


class TemplateRegistry:
    """Registry of all available templates."""

    _templates: Dict[str, BaseTemplate] = {}

    @classmethod
    def register(cls, template: BaseTemplate):
        """Register a template."""
        cls._templates[template.name] = template

    @classmethod
    def get(cls, name: str) -> BaseTemplate:
        """Get template by name."""
        if name not in cls._templates:
            raise ValueError(f"Template '{name}' not found")
        return cls._templates[name]

    @classmethod
    def list_all(cls) -> List[Dict[str, str]]:
        """List all templates (for API)."""
        return [
            {
                'name': t.name,
                'display_name': t.display_name,
                'description': t.description,
            }
            for t in cls._templates.values()
        ]

    @classmethod
    def get_names(cls) -> List[str]:
        """Get list of template names."""
        return list(cls._templates.keys())


# Register templates
TemplateRegistry.register(BlankTemplate())
TemplateRegistry.register(AWSTemplate())
