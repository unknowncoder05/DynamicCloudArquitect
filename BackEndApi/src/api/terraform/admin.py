"""Django admin configuration for Terraform models."""
from django.contrib import admin
from .models import (
    TerraformProject,
    GitBranch,
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


@admin.register(TerraformProject)
class TerraformProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'terraform_version', 'git_branch', 'created_at', 'updated_at')
    list_filter = ('terraform_version', 'created_at')
    search_fields = ('name', 'description', 'user__email')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(GitBranch)
class GitBranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'is_default', 'last_commit_hash', 'last_commit_date')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name', 'project__name', 'last_commit_message')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(TerraformProvider)
class TerraformProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'alias', 'project', 'region', 'version')
    list_filter = ('name', 'created_at')
    search_fields = ('name', 'alias', 'project__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(TerraformModule)
class TerraformModuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'source', 'version', 'parent_module')
    list_filter = ('created_at',)
    search_fields = ('name', 'source', 'project__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(TerraformResource)
class TerraformResourceAdmin(admin.ModelAdmin):
    list_display = ('terraform_address', 'resource_type', 'resource_name', 'status', 'project')
    list_filter = ('resource_type', 'status', 'created_at')
    search_fields = ('terraform_address', 'resource_name', 'resource_type', 'project__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(ResourceDependency)
class ResourceDependencyAdmin(admin.ModelAdmin):
    list_display = ('from_resource', 'to_resource', 'dependency_type', 'created_at')
    list_filter = ('dependency_type', 'created_at')
    search_fields = ('from_resource__terraform_address', 'to_resource__terraform_address')
    readonly_fields = ('id', 'created_at')


@admin.register(TerraformVariable)
class TerraformVariableAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'project', 'module', 'sensitive')
    list_filter = ('type', 'sensitive', 'created_at')
    search_fields = ('name', 'description', 'project__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(TerraformOutput)
class TerraformOutputAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'module', 'sensitive')
    list_filter = ('sensitive', 'created_at')
    search_fields = ('name', 'description', 'project__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(TerraformStateFile)
class TerraformStateFileAdmin(admin.ModelAdmin):
    list_display = ('project', 'version', 'serial', 'terraform_version', 'resources_count', 'created_at')
    list_filter = ('terraform_version', 'created_at')
    search_fields = ('project__name', 'lineage')
    readonly_fields = ('id', 'created_at')


@admin.register(TerraformExecution)
class TerraformExecutionAdmin(admin.ModelAdmin):
    list_display = ('project', 'execution_type', 'status', 'initiated_by', 'started_at', 'completed_at')
    list_filter = ('execution_type', 'status', 'created_at')
    search_fields = ('project__name', 'initiated_by__email', 'error_message')
    readonly_fields = ('id', 'created_at')


@admin.register(ResourceCloudStatus)
class ResourceCloudStatusAdmin(admin.ModelAdmin):
    list_display = ('resource', 'cloud_resource_id', 'status', 'ip_address', 'last_checked_at')
    list_filter = ('status', 'last_checked_at')
    search_fields = ('resource__terraform_address', 'cloud_resource_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
