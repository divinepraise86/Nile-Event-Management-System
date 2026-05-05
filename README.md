# Nile-Event-Management-System
Here is the step-by-step for how we are doing things:

CLONE THE REPO FIRST
1. Always start fresh
Before you start coding anything, make sure your local develop branch is up to date so we don't get merge conflicts:
git checkout develop
git pull origin develop

2. Create a feature branch
Never code directly on develop. Always create a new branch for whatever specific page or feature you are building:
git checkout -b feature/name-of-your-feature

3. Save your work
When you are done with a chunk of work, stage and commit your changes with a clear message about what you did:
git add .
git commit -m "Added the buttons to the login page"

4. Push and create a PR
Push your branch up to GitHub:
git push origin feature/name-of-your-feature
Then, go to the GitHub page and click Compare & pull request. Make sure the base branch is set to develop.

Once your PR is up, I will review the code, and we can merge it in!"
