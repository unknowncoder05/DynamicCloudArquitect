"""Terraform infrastructure models."""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .encryption import encrypt_field, decrypt_field

User = get_user_model()


class TerraformProject(models.Model):
    """Top-level container for a Terraform infrastructure project."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='terraform_projects')
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)

    # Git integration
    git_repository_url = models.URLField(blank=True, null=True)
    git_branch = models.CharField(max_length=200, default='main')
    git_commit_hash = models.CharField(max_length=40, blank=True)

    # Terraform version
    terraform_version = models.CharField(max_length=20, default='1.6.0')

    # UI metadata (canvas position, zoom, etc.)
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class GitBranch(models.Model):
    """Git branches within a Terraform project."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='git_branches')
    name = models.CharField(max_length=200)
    is_default = models.BooleanField(default=False)

    # Last commit info
    last_commit_hash = models.CharField(max_length=40, blank=True)
    last_commit_message = models.TextField(blank=True)
    last_commit_author = models.CharField(max_length=200, blank=True)
    last_commit_date = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']
        unique_together = [['project', 'name']]
        verbose_name_plural = 'Git branches'

    def __str__(self):
        return f"{self.project.name}/{self.name}"


class TerraformProvider(models.Model):
    """Cloud provider configuration (AWS, Azure, GCP, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='providers')

    # Provider identification
    name = models.CharField(max_length=100)  # e.g., 'aws', 'azurerm', 'google'
    alias = models.CharField(max_length=100, blank=True)  # for multiple provider instances
    version = models.CharField(max_length=50, blank=True)  # version constraint

    # Credentials (optional - can be set at execution time instead)
    credential = models.ForeignKey(
        'CloudProviderCredential',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='providers'
    )

    # Provider config
    region = models.CharField(max_length=100, blank=True)  # default region
    configuration = models.JSONField(default=dict, blank=True)  # provider-specific config

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', 'alias']
        unique_together = [['project', 'name', 'alias']]

    def __str__(self):
        if self.alias:
            return f"{self.name}.{self.alias}"
        return self.name


class CloudProviderCredential(models.Model):
    """
    Secure storage for cloud provider credentials.

    Credentials are encrypted at rest using Fernet encryption.
    Supports AWS, Azure, GCP, and other cloud providers.
    """

    PROVIDER_TYPE_CHOICES = [
        ('aws', 'Amazon Web Services'),
        ('azure', 'Microsoft Azure'),
        ('gcp', 'Google Cloud Platform'),
        ('digitalocean', 'DigitalOcean'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cloud_credentials')

    # Credential identification
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    provider_type = models.CharField(max_length=50, choices=PROVIDER_TYPE_CHOICES)

    # AWS credentials (encrypted)
    _aws_access_key_id = models.TextField(blank=True, db_column='aws_access_key_id')
    _aws_secret_access_key = models.TextField(blank=True, db_column='aws_secret_access_key')
    _aws_session_token = models.TextField(blank=True, db_column='aws_session_token')
    aws_region = models.CharField(max_length=50, blank=True)  # Not sensitive

    # Azure credentials (encrypted)
    _azure_subscription_id = models.TextField(blank=True, db_column='azure_subscription_id')
    _azure_tenant_id = models.TextField(blank=True, db_column='azure_tenant_id')
    _azure_client_id = models.TextField(blank=True, db_column='azure_client_id')
    _azure_client_secret = models.TextField(blank=True, db_column='azure_client_secret')

    # GCP credentials (encrypted)
    _gcp_project_id = models.TextField(blank=True, db_column='gcp_project_id')
    _gcp_service_account_json = models.TextField(blank=True, db_column='gcp_service_account_json')

    # Generic credentials for other providers (encrypted)
    _generic_credentials = models.TextField(blank=True, db_column='generic_credentials')

    # Metadata
    is_default = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    # Audit fields
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_validated_at = models.DateTimeField(null=True, blank=True)
    is_valid = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']
        unique_together = [['user', 'name']]
        indexes = [
            models.Index(fields=['user', 'provider_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.provider_type}) - {self.user.email}"

    # AWS Credentials Properties
    @property
    def aws_access_key_id(self):
        """Decrypt and return AWS access key ID."""
        if self._aws_access_key_id:
            return decrypt_field(self._aws_access_key_id)
        return ""

    @aws_access_key_id.setter
    def aws_access_key_id(self, value):
        """Encrypt and store AWS access key ID."""
        if value:
            self._aws_access_key_id = encrypt_field(value)
        else:
            self._aws_access_key_id = ""

    @property
    def aws_secret_access_key(self):
        """Decrypt and return AWS secret access key."""
        if self._aws_secret_access_key:
            return decrypt_field(self._aws_secret_access_key)
        return ""

    @aws_secret_access_key.setter
    def aws_secret_access_key(self, value):
        """Encrypt and store AWS secret access key."""
        if value:
            self._aws_secret_access_key = encrypt_field(value)
        else:
            self._aws_secret_access_key = ""

    @property
    def aws_session_token(self):
        """Decrypt and return AWS session token."""
        if self._aws_session_token:
            return decrypt_field(self._aws_session_token)
        return ""

    @aws_session_token.setter
    def aws_session_token(self, value):
        """Encrypt and store AWS session token."""
        if value:
            self._aws_session_token = encrypt_field(value)
        else:
            self._aws_session_token = ""

    # Azure Credentials Properties
    @property
    def azure_subscription_id(self):
        """Decrypt and return Azure subscription ID."""
        if self._azure_subscription_id:
            return decrypt_field(self._azure_subscription_id)
        return ""

    @azure_subscription_id.setter
    def azure_subscription_id(self, value):
        """Encrypt and store Azure subscription ID."""
        if value:
            self._azure_subscription_id = encrypt_field(value)
        else:
            self._azure_subscription_id = ""

    @property
    def azure_tenant_id(self):
        """Decrypt and return Azure tenant ID."""
        if self._azure_tenant_id:
            return decrypt_field(self._azure_tenant_id)
        return ""

    @azure_tenant_id.setter
    def azure_tenant_id(self, value):
        """Encrypt and store Azure tenant ID."""
        if value:
            self._azure_tenant_id = encrypt_field(value)
        else:
            self._azure_tenant_id = ""

    @property
    def azure_client_id(self):
        """Decrypt and return Azure client ID."""
        if self._azure_client_id:
            return decrypt_field(self._azure_client_id)
        return ""

    @azure_client_id.setter
    def azure_client_id(self, value):
        """Encrypt and store Azure client ID."""
        if value:
            self._azure_client_id = encrypt_field(value)
        else:
            self._azure_client_id = ""

    @property
    def azure_client_secret(self):
        """Decrypt and return Azure client secret."""
        if self._azure_client_secret:
            return decrypt_field(self._azure_client_secret)
        return ""

    @azure_client_secret.setter
    def azure_client_secret(self, value):
        """Encrypt and store Azure client secret."""
        if value:
            self._azure_client_secret = encrypt_field(value)
        else:
            self._azure_client_secret = ""

    # GCP Credentials Properties
    @property
    def gcp_project_id(self):
        """Decrypt and return GCP project ID."""
        if self._gcp_project_id:
            return decrypt_field(self._gcp_project_id)
        return ""

    @gcp_project_id.setter
    def gcp_project_id(self, value):
        """Encrypt and store GCP project ID."""
        if value:
            self._gcp_project_id = encrypt_field(value)
        else:
            self._gcp_project_id = ""

    @property
    def gcp_service_account_json(self):
        """Decrypt and return GCP service account JSON."""
        if self._gcp_service_account_json:
            return decrypt_field(self._gcp_service_account_json)
        return ""

    @gcp_service_account_json.setter
    def gcp_service_account_json(self, value):
        """Encrypt and store GCP service account JSON."""
        if value:
            self._gcp_service_account_json = encrypt_field(value)
        else:
            self._gcp_service_account_json = ""

    # Generic Credentials Properties
    @property
    def generic_credentials(self):
        """Decrypt and return generic credentials."""
        if self._generic_credentials:
            return decrypt_field(self._generic_credentials)
        return ""

    @generic_credentials.setter
    def generic_credentials(self, value):
        """Encrypt and store generic credentials."""
        if value:
            self._generic_credentials = encrypt_field(value)
        else:
            self._generic_credentials = ""


class TerraformModule(models.Model):
    """Reusable Terraform modules."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='modules')
    parent_module = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='child_modules')

    # Module identification
    name = models.CharField(max_length=200)
    source = models.CharField(max_length=500)  # module source (path, registry, git)
    version = models.CharField(max_length=50, blank=True)
    path = models.CharField(max_length=500)  # relative path in project

    # UI metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"module.{self.name}"


class TerraformResource(models.Model):
    """Individual Terraform resources (EC2, S3, VPC, etc.)."""

    STATUS_CHOICES = [
        ('unknown', 'Unknown'),
        ('planning', 'Planning'),
        ('applying', 'Applying'),
        ('created', 'Created'),
        ('updating', 'Updating'),
        ('error', 'Error'),
        ('destroyed', 'Destroyed'),
    ]

    # Define containment rules: parent_type -> [allowed_child_types]
    CONTAINER_RULES = {
        'aws_account': ['aws_vpc', 'aws_s3_bucket', 'aws_iam_role', 'aws_iam_policy', 'aws_cloudwatch_log_group', 'aws_sns_topic', 'aws_sqs_queue'],
        'aws_vpc': ['aws_subnet', 'aws_internet_gateway', 'aws_nat_gateway', 'aws_vpn_gateway', 'aws_security_group'],
        'aws_subnet': ['aws_instance', 'aws_db_instance', 'aws_elasticache_cluster', 'aws_efs_mount_target', 'aws_lambda_function'],
        'aws_autoscaling_group': ['aws_instance'],
        'aws_ecs_cluster': ['aws_ecs_service'],
        'aws_ecs_service': ['aws_ecs_task_definition'],
    }

    # Resources that MUST have a parent
    REQUIRES_PARENT = [
        'aws_instance',
        'aws_db_instance',
        'aws_db_subnet_group',
        'aws_elasticache_cluster',
        'aws_lambda_function',
        'aws_efs_mount_target',
    ]

    # Container resources (can contain others)
    CONTAINER_TYPES = [
        'aws_account',
        'aws_vpc',
        'aws_subnet',
        'aws_autoscaling_group',
        'aws_ecs_cluster',
        'aws_ecs_service',
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='resources')
    module = models.ForeignKey(TerraformModule, null=True, blank=True, on_delete=models.CASCADE, related_name='resources')
    provider = models.ForeignKey(TerraformProvider, null=True, blank=True, on_delete=models.SET_NULL, related_name='resources')

    # NEW: Parent resource for containment hierarchy
    parent_resource = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='contained_resources',
        help_text='Parent container resource (e.g., subnet for an instance)'
    )

    # Resource identification
    resource_type = models.CharField(max_length=200, db_index=True)  # e.g., 'aws_instance'
    resource_name = models.CharField(max_length=200, db_index=True)  # Terraform resource name
    terraform_address = models.CharField(max_length=500, unique=True)  # full address

    # Resource data
    configuration = models.JSONField(default=dict, blank=True)  # resource attributes
    metadata = models.JSONField(default=dict, blank=True)  # UI properties (position, color)

    # Data source flag
    is_data_source = models.BooleanField(
        default=False,
        help_text='True if this is a data source (queries existing infrastructure), False if managed resource'
    )

    # NEW: Cloud-specific fields
    availability_zone = models.CharField(max_length=50, blank=True)  # e.g., 'us-east-1a'

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unknown')
    state_id = models.CharField(max_length=200, blank=True)  # ID from state file

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['resource_type', 'resource_name']
        indexes = [
            models.Index(fields=['project', 'resource_type']),
            models.Index(fields=['terraform_address']),
            models.Index(fields=['parent_resource']),
        ]

    def __str__(self):
        return self.terraform_address

    def clean(self):
        """Validate parent-child relationships."""
        super().clean()

        # Check if resource requires a parent
        if self.resource_type in self.REQUIRES_PARENT and not self.parent_resource:
            parent_types = self._get_valid_parent_types()
            raise ValidationError(
                f"{self.resource_type} must have a parent resource. "
                f"Valid parents: {', '.join(parent_types)}"
            )

        # Validate parent-child compatibility
        if self.parent_resource:
            parent_type = self.parent_resource.resource_type
            allowed_children = self.CONTAINER_RULES.get(parent_type, [])

            if self.resource_type not in allowed_children:
                raise ValidationError(
                    f"{parent_type} cannot contain {self.resource_type}. "
                    f"Allowed children: {', '.join(allowed_children)}"
                )

        # Check for circular reference
        if self.parent_resource:
            self._check_circular_reference()

    def _get_valid_parent_types(self):
        """Get list of valid parent types for this resource."""
        return [
            parent_type
            for parent_type, children in self.CONTAINER_RULES.items()
            if self.resource_type in children
        ]

    def _check_circular_reference(self):
        """Check for circular parent-child relationships."""
        visited = {self.id}
        current = self.parent_resource

        while current:
            if current.id in visited:
                raise ValidationError("Circular parent-child relationship detected")
            visited.add(current.id)
            current = current.parent_resource

    def get_hierarchy_path(self):
        """Get full hierarchy path (e.g., VPC > Subnet > Instance)."""
        path = [self.resource_name]
        current = self.parent_resource

        while current:
            path.insert(0, current.resource_name)
            current = current.parent_resource

        return ' > '.join(path)

    def get_all_children(self):
        """Recursively get all contained resources."""
        children = list(self.contained_resources.all())
        for child in list(children):
            children.extend(child.get_all_children())
        return children

    @property
    def is_container(self):
        """Check if this resource can contain others."""
        return self.resource_type in self.CONTAINER_TYPES

    @property
    def can_have_parent(self):
        """Check if this resource type can have a parent."""
        for allowed_children in self.CONTAINER_RULES.values():
            if self.resource_type in allowed_children:
                return True
        return False


class ResourceDependency(models.Model):
    """Track dependencies between resources."""

    DEPENDENCY_TYPE_CHOICES = [
        ('implicit', 'Implicit'),  # Inferred from attribute references
        ('explicit', 'Explicit'),  # defined via depends_on
        ('data', 'Data'),  # Data source dependency
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_resource = models.ForeignKey(
        TerraformResource,
        on_delete=models.CASCADE,
        related_name='dependencies_from'
    )
    to_resource = models.ForeignKey(
        TerraformResource,
        on_delete=models.CASCADE,
        related_name='dependencies_to'
    )
    dependency_type = models.CharField(max_length=20, choices=DEPENDENCY_TYPE_CHOICES, default='implicit')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['from_resource', 'to_resource']]
        verbose_name_plural = 'Resource dependencies'

    def clean(self):
        """Validate that a resource doesn't depend on itself."""
        if self.from_resource_id == self.to_resource_id:
            raise ValidationError("A resource cannot depend on itself.")

    def __str__(self):
        return f"{self.from_resource.terraform_address} -> {self.to_resource.terraform_address}"


class TerraformVariable(models.Model):
    """Input variables for Terraform configuration."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='variables')
    module = models.ForeignKey(TerraformModule, null=True, blank=True, on_delete=models.CASCADE, related_name='variables')

    # Variable definition
    name = models.CharField(max_length=200, db_index=True)
    type = models.CharField(max_length=100)  # string, number, bool, list, map, object
    description = models.TextField(blank=True)

    # Values
    default_value = models.JSONField(null=True, blank=True)
    value = models.JSONField(null=True, blank=True)  # actual value provided

    # Flags
    sensitive = models.BooleanField(default=False)

    # Validation
    validation_rules = models.JSONField(default=list, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = [['project', 'module', 'name']]

    def __str__(self):
        if self.module:
            return f"var.{self.module.name}.{self.name}"
        return f"var.{self.name}"


class TerraformOutput(models.Model):
    """Output values from Terraform configuration."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='outputs')
    module = models.ForeignKey(TerraformModule, null=True, blank=True, on_delete=models.CASCADE, related_name='outputs')

    # Output definition
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)

    # Value
    value = models.JSONField(null=True, blank=True)
    sensitive = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = [['project', 'module', 'name']]

    def __str__(self):
        if self.module:
            return f"output.{self.module.name}.{self.name}"
        return f"output.{self.name}"


class TerraformStateFile(models.Model):
    """Store snapshots of Terraform state."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='state_files')
    branch = models.ForeignKey(GitBranch, null=True, blank=True, on_delete=models.SET_NULL, related_name='state_files')

    # State metadata
    version = models.IntegerField()  # state file version
    terraform_version = models.CharField(max_length=20)
    serial = models.IntegerField()  # state serial number
    lineage = models.CharField(max_length=100)  # unique state lineage identifier

    # State data
    state_data = models.JSONField()  # full state file content
    resources_count = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'version']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.project.name} state v{self.version}"


class TerraformExecution(models.Model):
    """Track Terraform plan/apply/destroy operations."""

    EXECUTION_TYPE_CHOICES = [
        ('init', 'Init'),
        ('plan', 'Plan'),
        ('apply', 'Apply'),
        ('destroy', 'Destroy'),
        ('refresh', 'Refresh'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(TerraformProject, on_delete=models.CASCADE, related_name='executions')
    branch = models.ForeignKey(GitBranch, null=True, blank=True, on_delete=models.SET_NULL, related_name='executions')

    # Execution details
    execution_type = models.CharField(max_length=20, choices=EXECUTION_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    initiated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='terraform_executions')

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Results
    plan_output = models.TextField(blank=True)
    changes_summary = models.JSONField(null=True, blank=True)  # {add: 5, change: 2, destroy: 1}
    logs = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.execution_type} - {self.status} ({self.project.name})"


class ResourceCloudStatus(models.Model):
    """Real-time status of deployed cloud resources (Phase 3)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource = models.OneToOneField(TerraformResource, on_delete=models.CASCADE, related_name='cloud_status')

    # Cloud resource info
    cloud_resource_id = models.CharField(max_length=500)  # actual cloud provider resource ID
    status = models.CharField(max_length=50)  # running, stopped, healthy, etc.

    # Network info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    url = models.URLField(blank=True)

    # Cost info
    cost_per_hour = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Status tracking
    last_checked_at = models.DateTimeField()

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_checked_at']
        indexes = [
            models.Index(fields=['last_checked_at']),
        ]
        verbose_name_plural = 'Resource cloud statuses'

    def __str__(self):
        return f"{self.resource.terraform_address} - {self.status}"
