---
layout: post
title: Bump version with PlistBuddy
---

Either you are an iOS, macOS developer or developing something in Apple ecosystem, you must be familiar with one file called `Info.plist`. At some point in development, for sure you want to release a new version of your app and increase that version number. With the recent find of the existence of `PlistBuddy`, it would be interesting to give it a try and also a small exercise for my shell scripting skill. As so this post will be about to create a simple shell script to bump version with help `PlistBuddy`. Let's kick started.

## What's plist?

In short, plist is filename extension of property list files. Usually, these files are used to store settings, they may be either user's settings or all kinds of settings you need. In iOS,  `Info.plist` stores some information like bundle identifier, version, supported orientation and more.

In a nutshell, plist file is a XML file, on the other hand, it is stored in XML format with a specific document type definition (DTD) defined by Apple. As described in [http://www.apple.com/DTDs/PropertyList-1.0.dtd](http://www.apple.com/DTDs/PropertyList-1.0.dtd),

```XML
<!ENTITY % plistObject "(array | data | date | dict | real | integer | string | true | false )" >
<!ELEMENT plist %plistObject;>
<!ATTLIST plist version CDATA "1.0" >

<!-- Collections -->
<!ELEMENT array (%plistObject;)*>
<!ELEMENT dict (key, %plistObject;)*>
<!ELEMENT key (#PCDATA)>

<!--- Primitive types -->
<!ELEMENT string (#PCDATA)>
<!ELEMENT data (#PCDATA)> <!-- Contents interpreted as Base-64 encoded -->
<!ELEMENT date (#PCDATA)> <!-- Contents should conform to a subset of ISO 8601 (in particular, YYYY '-' MM '-' DD 'T' HH ':' MM ':' SS 'Z'.  Smaller units may be omitted with a loss of precision) -->

<!-- Numerical primitives -->
<!ELEMENT true EMPTY>  <!-- Boolean constant true -->
<!ELEMENT false EMPTY> <!-- Boolean constant false -->
<!ELEMENT real (#PCDATA)> <!-- Contents should represent a floating point number matching ("+" | "-")? d+ ("."d*)? ("E" ("+" | "-") d+)? where d is a digit 0-9.  -->
<!ELEMENT integer (#PCDATA)> <!-- Contents should represent a (possibly signed) integer number in base 10 -->
```

plist defines 10 elements, they are `plist`, `array`, `data`, `date`, `dict`, `real`, `integer`, `string`, `true` and `false`, corresponding to 9 supported data types. The `plist`, in fact, is a special one, used as the root element of a document, and follow by `plist`, it must be one of the rest elements. In case of `Info.plist`, we often see it is followed by a `dict`, for example.

```XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
</dict>
```

The `dict` receives pairs of `key` of other elements as its children and we can interpret it as key and value. Obviously, we can have multiple nested `dict` elements, just need to follow its definition `<!ELEMENT dict (key, %plistObject;)*>`.

The `array` is another one that needs to take note. Unlike `dict`, `array` does not require `key`, it allows any other elements, include itself but except `plist` to be its children instead. It can be nested as well as `dict`.

```XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
```

In the combination of 9 elements and nested ability of `dict` and `array`, we can create complex data structures to persist almost necessary settings and information.

## What's PlistBuddy?

`PlistBuddy` is a command line tool to manipulate plist file. It can be run in interactive mode or execute and exit mode. In interactive mode, we can write commands and their parameters, then save our work with `Save` command. Likewise, in execute and exit mode, we stringifies commands and parameters, and pass these strings as values of option `-c`. For example, we want to read the version in `Info.plist`, the complete command will look like this.

```bash
/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' Info.plist
```

_**Note:** `PlistBuddy` is not in the path like `/usr/bin`, therefore we need to use the full path or we need to add `/usr/libexec/` to the environment variable `PATH`_.

## Bump version

Bump version is action to update the version of an app, a library or anything having a version tagged to it, to a higher number. If you are using [semver](https://semver.org), the version number will consist of 3 components: major, minor and patch, in the format of `<major>.<minor>.<patch>`.

We do bump version quite frequently so it is a good idea to automate this action instead of manually changing it, through Xcode for example.

You might be thinking of using [Fastlane](https://fastlane.tools) to do this. Yeah, it is a great tool for automation and if you haven't heard or used it, I highly recommend to give it a try, it is worth and would save you plenty of time. [agvtool](https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man1/agvtool.1.html) is an another alternative to do this. Version-related actions in Fastlane, like `increment_version_number`, `get_version_number`, boil down to use `avgtool` themselves.

However, for the sake of shell script exercise, I will walk you through everything from ground, of course, with the use of `PlistBuddy` I have just introduced above.

The idea is pretty simple, we will go step by step as below:

1. Read the current version from `Info.plist`.
2. Extract the version component.
3. Increase the version.
4. Write the new version to `Info.plist`.

### Read the current version

Actually, this step is already revealed so here I just recall and modify it a bit to store the result in a variable.

```bash
version=$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' Info.plist)
```

Now we have the current version stored in `version`.

### Extract the version component

Next step is to separate the version to components and increase them according to our need.

As mentioned earlier, we have 3 components: major, minor and patch. Except for patch, change of major or minor will reset its subsidiary component(s) to zero. For instance, we have `1.0.5` and we want to increase the minor so the result will be `1.1.0`, the patch is reset to zero.

To break out the version, we can simply use `read` and change the internal field separator (IFS) to dot character `.`.

```bash
IFS="." read major minor patch <<< "$version"
```

_**Note:** An alternative is to replace `.` by space character ` `, doing so, we do not need to change `IFS`.

With the major, minor and patch in hand, we proceed to the next step.

### Increase the version

To increase the version, firstly, we need to know which component to increase, it may be either major, minor or patch. We use an argument to determine this by introducing three ones: `major`, `minor` and `patch` to change the major, minor and patch respectively.

```bash
component=$1
if [[ "$component" = 'major' ]]; then
    // Increase major
    // Reset minor and patch
elif [[ "$component" = 'minor' ]]; then
    // Increase minor
    // Reset patch
elif [[ "$component" = 'patch' ]]; then
    // Increase patch
fi
```

That is the boilerplate for checking the argument, and if the argument is other than `major`, `minor` or `patch`, we do nothing.

The rest of work in this step is just doing simple mathematics.

```bash
if [[ "$component" = 'major' ]]; then
    major=$((major + 1))
    minor=0
    patch=0
elif [[ "$component" = 'minor' ]]; then
    minor=$((minor + 1))
    patch=0
elif [[ "$component" = 'patch' ]]; then
    patch=$((patch + 1))
fi
```

Now, compose the major, minor and patch to create the new version.

```bash
version="${major}.${minor}.${patch}"
```

### Write the new version

We are almost there. The final step is to write back the new version to `Info.plist`.

```bash
/usr/libexec/PlistBuddy -c "Set CFBundleShortVersionString ${version}" NVActivityIndicatorView/Info.plist
```

## Sum up

Assemble everything, we have the complete shell script to bump version according which component we pass in. The gist of this complete script is also available [here](https://gist.github.com/ninjaprox/71628f262616e15cc1dcca235299e0eb).

```bash
#!/bin/bash

component=$1

version=$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' Info.plist)
IFS="." read major minor patch <<< "$version"

echo "$version"

if [[ "$component" = 'major' ]]; then
    major=$((major + 1))
    minor=0
    patch=0
elif [[ "$component" = 'minor' ]]; then
    minor=$((minor + 1))
    patch=0
elif [[ "$component" = 'patch' ]]; then
    patch=$((patch + 1))
fi

version="${major}.${minor}.${patch}"

echo "$version"

/usr/libexec/PlistBuddy -c "Set CFBundleShortVersionString ${version}" Info.plist
```

You can add things like to create a new commit after bump version, tag the commit with the new version, it is totally open to your requirements.

Bump version is just one simple example what we can do with `PlistBuddy`. Now we can add PlistBuddy to our toolbelt and use it anytime we need to manipulate a plist file.

## Reference

I recommend to read [Xcode - xcworkspace and xcodeproj](http://neurocline.github.io/dev/2016/04/16/xcode-xcworkspace-and-xcodeproj.html) to understand the structure of `xcworkspace` and `xcodeproj`, it is especially helpful when you need to do complex tasks. In the article, you can find other resources to dig deeper as you want.
