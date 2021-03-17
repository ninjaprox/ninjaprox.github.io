---
layout: post
title: How to ignore/hide change from Git
---

Git is a popular distributed version control system, which helps keeping track of changes less hassle. In some scenarios, we might want Git to ignore some changes or hide them from Git. In this post, we'll explore a couple of ways to do so.

# Basics

Let's go back basics first. There're 3 states in Git, namely modified, staged and committed. These states apply to files on which Git has an eye. For those Git doesn't track yet, we have another state named *untracked*—they are listed under _Untracked files_ when `git status`. Files are either modified, staged or committed can be seen as *tracked* ones.

We human only see *working directory* and files in it just like what we see when `ls`. *Working directory* is nothing but a directory created when we clone a Git repo, it's an ordinary directory in a filesystem. Whenever we modify, add or remove files in *working directory*, we see only one version of them at that moment. If another person looks at *working directory* later, they can't tell what changes we made. That another person is Git. Git wouldn't be so useful, if it sorely relied on *working directory*. Therefore, Git adds another place called *index* which aids in detecting differences. *Index* is a version of *working directory*, any changes we make in *working directory* are compared to *index*, and from there Git can keep track of changes.

Connect this to states above, we can think of *tracked files* are *indexed files*—files are added to *index*—and vice versa.

# Untracked files

A common example for untracked files—if you're using macOS—is the metadata file `.DS_Store`. We usually put this file in `.gitignore`. `.gitingore` is used when we want to share ignored files with other people since it's always committed in a Git repo.

How about if we want to ignore some locally only, and not to share or modify `.gitignore`? `$GIT_DIR/info/exclude` has the same effect as `.gitignore`, except it's only applicable locally in a specific repo. `$GIT_DIR` is actually `.git` folder in a working directory after we clone from a Git repo. All things behind the scene of Git are stored in this folder, and we can call it the Git repo itself.

To make these files observable again from Git, we simply remove them from `.gitignore` or `$GIT_DIR/info/exclude`.

# Tracked files

Now the fun part comes. How do we temporarily hide tracked files from Git? A use case for it could be a shared configuration file. Usually, it's committed and shared among people, but we need to change some of its values while tinkering and also don't want the noise when `git status`—the file will be listed in _Changes not staged for commit_. We can use `git update-index --skip-worktree <files>` for this purpose. `git update-index` is a low-level command, a plumbing one in Git parlance, which allows us to manipulate Git _index_. `--skip-worktree` option tells Git to pretend that a file in *working directory* isn't changed—even it's in fact—so that the file is treated as *unmodified* on comparing to _index_. As a result, we won't see the file in _Changes not staged for commit_.

To undo, we use `git update-index --no-skip-worktree <files>`. It's straightforward if we remember files, otherwise it would be not so obvious to find out. Luckily, `git ls-files -v` comes to rescue. Files start **S** tag are ones we skipped.

# Summary

For untracked files, `.gitignore` or `$GIT_DIR/info/exclude` depends on whether or not we want to shared these ignore files respectively.

For tracked files, `git update-index --skip-worktree <files>` will do the job, and `git ls-files-v` is nice to help when we need to undo.