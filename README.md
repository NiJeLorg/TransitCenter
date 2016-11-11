# TransitCenter NYC Bus Analytics
Under development by [TransitCenter](http://www.transitcenter.org), NYC Bus Analytics will be a tool for advocates who want a more effective bus system in New York City. 

## Local Development Installation
Note: Do not use this workflow for deploying this tool to production, as this may introduce a number of security concerns. For more information on deploying Django in a production environment, please see the [Django deployment checklist](https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/)

To install your local machine:
* [Clone this repository](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository#Cloning-an-Existing-Repository) to your local machine.
* In the directory where you placed the cloned repo, create a virtual environment for Python and project dependencies in a directory called "env":
```shell
pip install virtualenv 
virtualenv env
```
* Activate your virtual environment
```shell
source env/bin/activate
```
* Install Django and all required packages:
```shell
pip install -r requirements.txt
```
* In ```/nycbus/nycbus/``` make a copy of ```dummy_settings.py``` called ```settings.py```
* In ```settings.py```:
  * Add a ```SECRET_KEY``` of 50 randomly generated characters,
  * Replace default [database settings](https://docs.djangoproject.com/en/1.10/ref/settings/#databases) with preferred database settings (optional) 
  * Add email password to ```EMAIL_HOST_PASSWORD``` setting. Contact JD for email password if needed.
* Still in the virtual environment, navigate to ```/nycbus/``` (you should see ```manage.py``` in there) and mirror database schema by running:
```shell
python manage.py migrate
```
* Fire up your local webserver:
```shell
python manage.py runserver
```
* In a web browser, go to [localhost:8000](http://localhost:8000/), and you should see the development site! Please not that the terminal window you are running the development site in must stay open while you are using the site.
* When daily development is complete, terminate the local web server by typing ```CONTROL + C```. Also deactivate the virtual environment:
```shell
deactivate
```

## Django project in a local web server
Once installed, it's easy to fire up your local web server to view the development version of this site.
* Navigate to the directory where your virtual environment is installed.
* Activate your virtual environment
```shell
source env/bin/activate
```
* Navigate to ```/nycbus/``` (again, you should see ```manage.py``` in there) 
* Fire up your local webserver:
```shell
python manage.py runserver
```
* In a web browser, go to [localhost:8000](http://localhost:8000/), and you should see the development site! 
* When daily development is complete, terminate the local web server by typing ```CONTROL + C```. Also deactivate the virtual environment:
```shell
deactivate
```

## Git workflow
Based off of the [workflow proposed by Vincent Driessen](http://nvie.com/posts/a-successful-git-branching-model/), we have two main branches -- `master` and `develop`, where `master` is "the main branch where the source code of HEAD always reflects a production-ready state." `Develop` is the "the main branch where the source code of HEAD always reflects a state with the latest delivered development changes for the next release."

Our workflow begins with deploying supporting branches off of `develop` for work, which may include branches for "hotfixes" (i.e. urgent bug fixing) or new features. 

###Feature Branches
When new feature development begins, create a branch off of `develop`:

    git checkout -b adding-new-feature develop

New feature branches can be named anything except for `master`, `develop` or prefixed with `hotfix-`. Once you are done working on your new feature, commit your code and push your branch to the repo:

    git commit -m 'made some changes'
    git push

Once your branch is pushed up to the repo, navigate to the [pull request section on GitHub](https://github.com/NiJeLorg/TransitCenter/compare) and [create a pull-request](https://help.github.com/articles/creating-a-pull-request/) from the base of `develop` to your feature branch. Write any comments that are relevant, tag users or reference issues.  

After the pull-request is submitted and the code is reviewed and approved, the feature branch will be merged into `develop`, and that feature branch will be closed. The can be done on GitHub or via command line:

    git pull origin develop
    git checkout develop
    git merge --no-ff adding-new-feature
    git branch -d myfeature
    git push origin develop

When `develop` is ready to be merged into `master`, it can be merged either via a pull request on GitHub or merged via command line:

    git pull origin master
    git checkout master
    git merge --no-ff develop
    git push origin master
    git checkout develop

###Hotfix Branches
If a critical bug in production needs to be addressed, create a branch off of `master` prefixed with `hotfix-`:
  
    git pull origin master
    git checkout -b hotfix-some-kind-of-bug master

When the bug is squashed, the hotfix branch needs to be merged into `master` and `develop`. first `master`:

    git pull origin master
    git checkout master
    git merge --no-ff hotfix-some-kind-of-bug
    git push origin master

and then `develop`:
    
    git pull origin develop
    git checkout develop
    git merge --no-ff hotfix-some-kind-of-bug
    git push origin develop

After both `master` and `develop` are updated, you can close the hotfix branch:

    git branch -d hotfix-some-kind-of-bug

