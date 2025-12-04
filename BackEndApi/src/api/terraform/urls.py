"""URL routing for Terraform API."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TerraformProjectViewSet,
    GitBranchViewSet,
    CloudProviderCredentialViewSet,
    TerraformProviderViewSet,
    TerraformModuleViewSet,
    TerraformResourceViewSet,
    ResourceDependencyViewSet,
    TerraformVariableViewSet,
    TerraformOutputViewSet,
    TerraformStateFileViewSet,
    TerraformExecutionViewSet,
    ResourceCloudStatusViewSet,
)

# Create router and register viewsets
router = DefaultRouter()

router.register(r'projects', TerraformProjectViewSet, basename='terraform-project')
router.register(r'branches', GitBranchViewSet, basename='git-branch')
router.register(r'credentials', CloudProviderCredentialViewSet, basename='cloud-credential')
router.register(r'providers', TerraformProviderViewSet, basename='terraform-provider')
router.register(r'modules', TerraformModuleViewSet, basename='terraform-module')
router.register(r'resources', TerraformResourceViewSet, basename='terraform-resource')
router.register(r'dependencies', ResourceDependencyViewSet, basename='resource-dependency')
router.register(r'variables', TerraformVariableViewSet, basename='terraform-variable')
router.register(r'outputs', TerraformOutputViewSet, basename='terraform-output')
router.register(r'state-files', TerraformStateFileViewSet, basename='terraform-state-file')
router.register(r'executions', TerraformExecutionViewSet, basename='terraform-execution')
router.register(r'cloud-status', ResourceCloudStatusViewSet, basename='resource-cloud-status')

urlpatterns = [
    path('', include(router.urls)),
]
