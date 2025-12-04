"""Git integration service for Terraform projects."""
import os
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from git import Repo, GitCommandError
from datetime import datetime


class GitService:
    """Handle Git operations for Terraform projects."""

    def __init__(self, project_path: str):
        """
        Initialize Git service with project path.

        Args:
            project_path: Path to the project directory
        """
        self.project_path = Path(project_path)
        self.repo = None

        if self._is_git_repo():
            self.repo = Repo(self.project_path)

    def _is_git_repo(self) -> bool:
        """Check if the project path is a git repository."""
        return (self.project_path / '.git').exists()

    def clone_repository(self, repo_url: str, branch: str = 'main') -> bool:
        """
        Clone a Git repository.

        Args:
            repo_url: URL of the Git repository
            branch: Branch to clone (default: main)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Create parent directory if it doesn't exist
            self.project_path.parent.mkdir(parents=True, exist_ok=True)

            # Clone repository
            self.repo = Repo.clone_from(repo_url, self.project_path, branch=branch)
            return True
        except GitCommandError as e:
            raise Exception(f"Error cloning repository: {str(e)}")

    def init_repository(self) -> bool:
        """
        Initialize a new Git repository.

        Returns:
            True if successful
        """
        try:
            self.project_path.mkdir(parents=True, exist_ok=True)
            self.repo = Repo.init(self.project_path)
            return True
        except Exception as e:
            raise Exception(f"Error initializing repository: {str(e)}")

    def get_current_branch(self) -> str:
        """Get the name of the current branch."""
        if not self.repo:
            raise Exception("No Git repository initialized")

        return self.repo.active_branch.name

    def list_branches(self, remote: bool = False) -> List[str]:
        """
        List all branches.

        Args:
            remote: If True, list remote branches

        Returns:
            List of branch names
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        if remote:
            return [ref.name for ref in self.repo.remote().refs]
        else:
            return [branch.name for branch in self.repo.branches]

    def create_branch(self, branch_name: str, checkout: bool = True) -> bool:
        """
        Create a new branch.

        Args:
            branch_name: Name of the new branch
            checkout: If True, checkout the new branch

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            new_branch = self.repo.create_head(branch_name)

            if checkout:
                new_branch.checkout()

            return True
        except Exception as e:
            raise Exception(f"Error creating branch: {str(e)}")

    def switch_branch(self, branch_name: str) -> bool:
        """
        Switch to a different branch.

        Args:
            branch_name: Name of the branch to switch to

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            self.repo.git.checkout(branch_name)
            return True
        except GitCommandError as e:
            raise Exception(f"Error switching branch: {str(e)}")

    def commit_changes(self, message: str, files: Optional[List[str]] = None) -> str:
        """
        Commit changes to the repository.

        Args:
            message: Commit message
            files: List of files to commit (None = all changes)

        Returns:
            Commit hash
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            # Add files
            if files:
                self.repo.index.add(files)
            else:
                self.repo.git.add(A=True)

            # Commit
            commit = self.repo.index.commit(message)
            return commit.hexsha
        except Exception as e:
            raise Exception(f"Error committing changes: {str(e)}")

    def push_changes(self, remote: str = 'origin', branch: Optional[str] = None) -> bool:
        """
        Push changes to remote repository.

        Args:
            remote: Name of the remote (default: origin)
            branch: Branch to push (None = current branch)

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            if branch is None:
                branch = self.get_current_branch()

            origin = self.repo.remote(remote)
            origin.push(branch)
            return True
        except Exception as e:
            raise Exception(f"Error pushing changes: {str(e)}")

    def pull_changes(self, remote: str = 'origin', branch: Optional[str] = None) -> bool:
        """
        Pull changes from remote repository.

        Args:
            remote: Name of the remote (default: origin)
            branch: Branch to pull (None = current branch)

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            if branch is None:
                branch = self.get_current_branch()

            origin = self.repo.remote(remote)
            origin.pull(branch)
            return True
        except Exception as e:
            raise Exception(f"Error pulling changes: {str(e)}")

    def get_commit_history(self, max_count: int = 50) -> List[Dict[str, Any]]:
        """
        Get commit history.

        Args:
            max_count: Maximum number of commits to return

        Returns:
            List of commit dictionaries
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        commits = []

        for commit in list(self.repo.iter_commits(max_count=max_count)):
            commits.append({
                'hash': commit.hexsha,
                'short_hash': commit.hexsha[:7],
                'author': str(commit.author),
                'email': commit.author.email,
                'message': commit.message.strip(),
                'date': datetime.fromtimestamp(commit.committed_date).isoformat(),
                'parents': [p.hexsha for p in commit.parents]
            })

        return commits

    def get_file_diff(self, commit_hash: Optional[str] = None) -> str:
        """
        Get diff of changes.

        Args:
            commit_hash: Specific commit to diff (None = working directory vs HEAD)

        Returns:
            Diff as string
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            if commit_hash:
                commit = self.repo.commit(commit_hash)
                if commit.parents:
                    diff = commit.parents[0].diff(commit, create_patch=True)
                else:
                    # First commit - show all files
                    diff = commit.diff(None, create_patch=True)
            else:
                # Working directory vs HEAD
                diff = self.repo.head.commit.diff(None, create_patch=True)

            return '\n'.join([d.diff.decode('utf-8') if d.diff else '' for d in diff])
        except Exception as e:
            raise Exception(f"Error getting diff: {str(e)}")

    def get_changed_files(self) -> Dict[str, List[str]]:
        """
        Get list of changed files.

        Returns:
            Dict with 'modified', 'untracked', 'staged' lists
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        return {
            'modified': [item.a_path for item in self.repo.index.diff(None)],
            'untracked': self.repo.untracked_files,
            'staged': [item.a_path for item in self.repo.index.diff('HEAD')]
        }

    def get_remote_url(self, remote: str = 'origin') -> Optional[str]:
        """
        Get remote URL.

        Args:
            remote: Name of the remote

        Returns:
            Remote URL or None
        """
        if not self.repo:
            return None

        try:
            return self.repo.remote(remote).url
        except Exception:
            return None

    def has_changes(self) -> bool:
        """Check if there are uncommitted changes."""
        if not self.repo:
            return False

        return self.repo.is_dirty() or len(self.repo.untracked_files) > 0

    def get_last_commit_info(self) -> Optional[Dict[str, Any]]:
        """
        Get information about the last commit.

        Returns:
            Dict with commit info or None
        """
        if not self.repo:
            return None

        try:
            commit = self.repo.head.commit
            return {
                'hash': commit.hexsha,
                'short_hash': commit.hexsha[:7],
                'author': str(commit.author),
                'email': commit.author.email,
                'message': commit.message.strip(),
                'date': datetime.fromtimestamp(commit.committed_date).isoformat()
            }
        except Exception:
            return None

    def merge_branch(self, branch_name: str, commit_message: Optional[str] = None) -> bool:
        """
        Merge a branch into the current branch.

        Args:
            branch_name: Name of the branch to merge
            commit_message: Custom merge commit message

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            current_branch = self.get_current_branch()
            self.repo.git.merge(branch_name, m=commit_message or f"Merge {branch_name} into {current_branch}")
            return True
        except GitCommandError as e:
            raise Exception(f"Error merging branch: {str(e)}")

    def has_conflicts(self) -> bool:
        """Check if there are merge conflicts."""
        if not self.repo:
            return False

        return len(self.repo.index.unmerged_blobs()) > 0

    def delete_branch(self, branch_name: str, force: bool = False) -> bool:
        """
        Delete a branch.

        Args:
            branch_name: Name of the branch to delete
            force: Force deletion even if not merged

        Returns:
            True if successful
        """
        if not self.repo:
            raise Exception("No Git repository initialized")

        try:
            self.repo.delete_head(branch_name, force=force)
            return True
        except Exception as e:
            raise Exception(f"Error deleting branch: {str(e)}")
