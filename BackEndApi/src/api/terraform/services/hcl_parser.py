"""Terraform HCL parser service."""
import os
import hcl2
import json
from typing import Dict, List, Any, Tuple
from pathlib import Path


class HCLParser:
    """Parse Terraform HCL files and extract resources, variables, outputs."""

    def __init__(self, project_path: str):
        """
        Initialize HCL parser with project path.

        Args:
            project_path: Path to the Terraform project directory
        """
        self.project_path = Path(project_path)

    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a single Terraform HCL file.

        Args:
            file_path: Path to the .tf file

        Returns:
            Dict containing parsed HCL data
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return hcl2.load(f)
        except Exception as e:
            raise ValueError(f"Error parsing {file_path}: {str(e)}")

    def find_terraform_files(self) -> List[str]:
        """
        Find all .tf files in the project directory (non-recursive by default).

        Returns:
            List of .tf file paths
        """
        return list(self.project_path.glob('*.tf'))

    def parse_project(self) -> Dict[str, Any]:
        """
        Parse all Terraform files in the project.

        Returns:
            Dict with parsed data: {
                'resources': [...],
                'data_sources': [...],
                'variables': [...],
                'outputs': [...],
                'providers': [...],
                'modules': [...],
                'terraform': {...}
            }
        """
        all_resources = []
        all_data_sources = []
        all_variables = []
        all_outputs = []
        all_providers = []
        all_modules = []
        terraform_config = {}

        tf_files = self.find_terraform_files()

        for tf_file in tf_files:
            try:
                parsed = self.parse_file(tf_file)

                # Extract resources
                if 'resource' in parsed:
                    resources = self._extract_resources(parsed['resource'], str(tf_file))
                    all_resources.extend(resources)

                # Extract data sources
                if 'data' in parsed:
                    data_sources = self._extract_data_sources(parsed['data'], str(tf_file))
                    all_data_sources.extend(data_sources)

                # Extract variables
                if 'variable' in parsed:
                    variables = self._extract_variables(parsed['variable'], str(tf_file))
                    all_variables.extend(variables)

                # Extract outputs
                if 'output' in parsed:
                    outputs = self._extract_outputs(parsed['output'], str(tf_file))
                    all_outputs.extend(outputs)

                # Extract providers
                if 'provider' in parsed:
                    providers = self._extract_providers(parsed['provider'], str(tf_file))
                    all_providers.extend(providers)

                # Extract modules
                if 'module' in parsed:
                    modules = self._extract_modules(parsed['module'], str(tf_file))
                    all_modules.extend(modules)

                # Extract terraform block
                if 'terraform' in parsed:
                    terraform_config = parsed['terraform'][0] if parsed['terraform'] else {}

            except Exception as e:
                print(f"Error parsing {tf_file}: {str(e)}")
                continue

        return {
            'resources': all_resources,
            'data_sources': all_data_sources,
            'variables': all_variables,
            'outputs': all_outputs,
            'providers': all_providers,
            'modules': all_modules,
            'terraform': terraform_config
        }

    def _extract_resources(self, resources_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract resource definitions from HCL data."""
        resources = []

        for resource_block in resources_data:
            for resource_type, instances in resource_block.items():
                for instance in instances:
                    for resource_name, config in instance.items():
                        resources.append({
                            'resource_type': resource_type,
                            'resource_name': resource_name,
                            'configuration': config if isinstance(config, dict) else {},
                            'file_path': file_path,
                            'terraform_address': f"{resource_type}.{resource_name}"
                        })

        return resources

    def _extract_data_sources(self, data_sources_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract data source definitions from HCL data."""
        data_sources = []

        for data_block in data_sources_data:
            for data_type, instances in data_block.items():
                for instance in instances:
                    for data_name, config in instance.items():
                        data_sources.append({
                            'resource_type': f"data.{data_type}",
                            'resource_name': data_name,
                            'configuration': config if isinstance(config, dict) else {},
                            'file_path': file_path,
                            'terraform_address': f"data.{data_type}.{data_name}"
                        })

        return data_sources

    def _extract_variables(self, variables_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract variable definitions from HCL data."""
        variables = []

        for var_block in variables_data:
            for var_name, config in var_block.items():
                if isinstance(config, dict):
                    variables.append({
                        'name': var_name,
                        'type': config.get('type', 'string'),
                        'description': config.get('description', ''),
                        'default_value': config.get('default'),
                        'sensitive': config.get('sensitive', False),
                        'file_path': file_path
                    })

        return variables

    def _extract_outputs(self, outputs_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract output definitions from HCL data."""
        outputs = []

        for output_block in outputs_data:
            for output_name, config in output_block.items():
                if isinstance(config, dict):
                    outputs.append({
                        'name': output_name,
                        'value': config.get('value'),
                        'description': config.get('description', ''),
                        'sensitive': config.get('sensitive', False),
                        'file_path': file_path
                    })

        return outputs

    def _extract_providers(self, providers_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract provider configurations from HCL data."""
        providers = []

        for provider_block in providers_data:
            for provider_name, configs in provider_block.items():
                for config in configs:
                    if isinstance(config, dict):
                        providers.append({
                            'name': provider_name,
                            'alias': config.get('alias', ''),
                            'region': config.get('region', ''),
                            'version': config.get('version', ''),
                            'configuration': config,
                            'file_path': file_path
                        })

        return providers

    def _extract_modules(self, modules_data: List[Dict], file_path: str) -> List[Dict]:
        """Extract module definitions from HCL data."""
        modules = []

        for module_block in modules_data:
            for module_name, config in module_block.items():
                if isinstance(config, dict):
                    modules.append({
                        'name': module_name,
                        'source': config.get('source', ''),
                        'version': config.get('version', ''),
                        'configuration': config,
                        'file_path': file_path
                    })

        return modules

    def extract_dependencies(self, resources: List[Dict]) -> List[Tuple[str, str, str]]:
        """
        Extract dependencies between resources by analyzing attribute references.

        Args:
            resources: List of resource dictionaries

        Returns:
            List of (from_address, to_address, type) tuples
        """
        dependencies = []

        for resource in resources:
            config = resource.get('configuration', {})
            from_address = resource['terraform_address']

            # Recursively find references in configuration
            refs = self._find_references_in_dict(config)

            for ref in refs:
                # Parse reference like "aws_vpc.main.id" to get "aws_vpc.main"
                parts = ref.split('.')
                if len(parts) >= 2:
                    to_address = f"{parts[0]}.{parts[1]}"
                    dependencies.append((from_address, to_address, 'implicit'))

        return dependencies

    def _find_references_in_dict(self, data: Any, refs: List[str] = None) -> List[str]:
        """
        Recursively find Terraform references in configuration.

        Looks for patterns like: ${aws_vpc.main.id} or var.vpc_id
        """
        if refs is None:
            refs = []

        if isinstance(data, dict):
            for value in data.values():
                self._find_references_in_dict(value, refs)
        elif isinstance(data, list):
            for item in data:
                self._find_references_in_dict(item, refs)
        elif isinstance(data, str):
            # Look for references pattern
            # Simple pattern matching for resource references
            if '${' in data and '}' in data:
                # Extract content between ${ and }
                import re
                matches = re.findall(r'\$\{([^}]+)\}', data)
                for match in matches:
                    # Skip var, local, data for now - focus on resource refs
                    if not match.startswith(('var.', 'local.', 'data.')):
                        refs.append(match)

        return refs

    def parse_state_file(self, state_file_path: str) -> Dict[str, Any]:
        """
        Parse Terraform state file.

        Args:
            state_file_path: Path to terraform.tfstate

        Returns:
            Dict containing parsed state data
        """
        try:
            with open(state_file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Error parsing state file: {str(e)}")

    def generate_hcl_from_resources(self, resources: List[Dict]) -> str:
        """
        Generate HCL code from resource definitions.

        Args:
            resources: List of resource dictionaries

        Returns:
            Generated HCL code as string
        """
        hcl_blocks = []

        for resource in resources:
            resource_type = resource.get('resource_type', '')
            resource_name = resource.get('resource_name', '')
            config = resource.get('configuration', {})

            block = f'resource "{resource_type}" "{resource_name}" {{\n'

            # Convert config dict to HCL
            for key, value in config.items():
                block += f'  {key} = {self._format_hcl_value(value)}\n'

            block += '}\n\n'
            hcl_blocks.append(block)

        return ''.join(hcl_blocks)

    def _format_hcl_value(self, value: Any) -> str:
        """Format Python value as HCL value."""
        if isinstance(value, bool):
            return str(value).lower()
        elif isinstance(value, str):
            return f'"{value}"'
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, list):
            items = [self._format_hcl_value(item) for item in value]
            return f"[{', '.join(items)}]"
        elif isinstance(value, dict):
            items = [f'{k} = {self._format_hcl_value(v)}' for k, v in value.items()]
            return '{\n    ' + '\n    '.join(items) + '\n  }'
        else:
            return str(value)
