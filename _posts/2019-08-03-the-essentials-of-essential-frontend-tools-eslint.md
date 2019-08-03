---
layout: post
title: The Essentials of Essential Front-end Tools, ESLint
---

Recently, I've been getting more involved in front-end development. The more I do, the more my mind and my soul get lost in its chaotic world. Even a simple To–Do–List app can easily require a bunch of tools—[ESLint](https://eslint.org), [Babel](https://babeljs.io/), [Webpack](https://webpack.js.org/), to name a few—and packages just to get started. Fortunately, there’re many starter kits out there so we don’t have to do from the ground up. With them, everything is already set up so we can start writing the first line of code right away. It saves time on repetitive, boring tasks, which can be great for experienced developers. However, this benefit comes with a price for beginners. Since everything works out of the box, it seems like magic, and they might not know what's really happening under the hood, which is important to understand at some level. Although the learning curve is not as steep as others—try to compare with some tools you've been learning and using, you'll get what I mean—in the chaotic world, we need a survival guide for the journey.

This series will cover fundamental tools of front-end development and what essential we need to know—to rule the tools instead of being controlled by them. In it, we’ll focus on the developer experience of each one of these tools so the goal of this series is to act as a survival guide and to give a high-level overview of each tool, not to serve as a documentation.

What will be included:

-   [ESLint](https://eslint.org) <- We are here
-   [Babel](https://babeljs.io/)
-   [Webpack](https://webpack.js.org/)
-   [Flow](https://flow.org)
-   [TypesScript](https://www.typescriptlang.org/)
-   [Jest](https://jestjs.io).

Enough of preface, let's get started with the first tool, ESLint.

# What is ESLint and Why?

ESLint is, as the name implies, a linter for [ECMAScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm). And, the definition of a linter is:

> a machine for removing the short fibers from cotton seeds after ginning.

Although code and cotton seeds don't have any relationship, regardless of code or cotton seeds, a linter will help make things cleaner and more consistent. We don't want to see the code like this:

```javascript
const count = 1;
const message = "Hello, ESLint";
count += 1;
```

It both looks ugly and has a mistake. Here's when ESLint steps in to help with that. Instead of letting the error be dumped out to the browser console when we run the code, ESLint will catch it as we're typing—not really, we’ll need editor or IDE extensions for this, which will be covered later. Obviously, this error isn't difficult to figure out, but wouldn't it be nicer to have an assistant reminding us every time we're about to make a mistake and perhaps auto-correcting it for us? Although ESLint can’t catch all kinds of errors, it at least spares us some effort so we can spend on other things that matter and need human attention.

# How does ESLint work?

Now that we know what ESLint is and why we need it, let's go a bit deeper and check out how it works. In essence, we can break it down to three big steps.

## Parser

The code that we write is nothing more than a sequence of characters. However, this sequence isn't just random characters, they need to follow a set of rules or conventions that is the grammar forming a language. For a human, going from reading text or code to understanding it conceptually takes us little effort. For a computer, this is much more difficult to accomplish. For example:

```javascript
const tool = "ESLint"; // 1
const tool = "ESLint"; // 2
```

As we read the two lines above, we immediately know that they are identical, and can be read as "there's a constant named `tool` with the value of ESLint". For a computer, which doesn't understand the meaning, these two lines look quite different. As a result, if we feed in raw code to ESLint, it's nearly impossible to do anything. When things get complicated and hard to communicate—think of how we can have a computer to understand what we do—abstraction can be an escape. By abstracting a thing, we hide all unnecessary details, reduce noise, and keep everyone on the same page, which eases the communication. In the above example, one space or two spaces don’t matter, neither do single quotes or double quotes.

In other words, that's what a parser does. It converts raw code to an Abstract Syntax Tree (AST), and this AST is used as the medium for lint rules to base on. There are still many steps a parser need to do in order to create an AST—if you're interested in learning more about how an AST is generated, [this tutorial](https://the-super-tiny-compiler.glitch.me/) has a good overview.

## Rules

The next step in the process is to run the AST through a list of rules. A rule is a logic of how to figure out potential existing issues in the code from the AST. Issues here aren't necessary syntactic or semantic errors but might be stylistic ones as well. The output given out from a rule will include some useful information for later use like lines of code, positions, and informative messages about the issue.

In addition to catching issues, a rule can even auto-correct code if possible. For example, when [no-multi-spaces](https://eslint.org/docs/rules/no-multi-spaces) is applied to the code above, it will trim all redundant spaces, which makes the code look clean and consistent.

```javascript
const tool = "ESLint"; // 2
// becomes
const tool = "ESLint"; // 2
```

In different scenarios, a rule can be used at different levels—opted-out, warning only, or strict error—and have various options, which gives us control on how to use the rule.

## Result

Here comes the end of the process. With the output from a rule, it's just the matter of how we display it in a human friendly manner, thanks to all the useful information we mentioned earlier. Then from the result, we can quickly point out the issue, where it is, and make a fix, or maybe not.

# Integration

ESLint can be used as a standalone tool with its robust CLI, but that’s a bare-bones way to use ESLint. We don't want to type in a command every time we want to lint code, especially in a development environment. The solution for this is to integrate ESLint into our development environment so we can write code and see issues caught by ESLint all in one place.

This kind of integration comes from extensions specific to IDEs or editors. These extensions require ESLint to work since they run ESLint behind the scene—no wonder that we still need to install ESLint along with them, they are nothing without ESLint. This principle applies to other IDE or editor extensions we are using daily.

Remember the output from a rule we talked above? An extension will use it to display in the IDE or editor. How exactly the output is displayed depends on how the extension is implemented and how the IDE or editor is open to its extensions. Some extensions also take advantage of the abilities of issue correction from rules to change code on save if we enable it.

# Configuration

Configuration is the main power that gives the versatility to a tool. ESLint is not different from that, except it has the most comprehensive configuration among other tools. In general, we need a file or a place to put the configuration, and there's a couple of options of us. All of them boil down to two main ways, either we have a separate configuration file for each tool or bundle them all in `package.json`. `.eslintrc.js` is one of the files that ESLint will be looking for its configuration, and also the one with the highest priority.

The next thing we need to know about configuration is its hierarchy and cascading behavior. Thanks to these features, we don't need to have a configuration file in every single folder in the project. If a configuration file doesn't exist in a folder, ESLint simply looks up the folder's parent for one until it can't find anyone, then it'll fall back to the user–wide default configuration in `~/.eslintrc`. Otherwise, the configuration file will add up or override the ones at upper levels.

There's, however, a special tweak on this. If we specify `root: true` in a configuration file, the lookup will stop at that file instead of going up like before. Besides, ESLint will use that configuration file as the root configuration, all child configurations will base on this one.

Not only limited to ESLint, but these things are common for other tools. Let's talk about ESLint specific configuration.

## Parser

The role of parser in ESLint has been discussed above. By default, ESLint uses [Espree](https://github.com/eslint/espree) as its parser. We can change this parser to another compatible one like [babel-eslint](https://www.npmjs.com/package/babel-eslint) or [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser) if we use Babel or Typescript respectively.

To configure the parser, we use `parserOptions`. Among options supported by Espree, here are some we often use and need to pay attention.

-   `ecmaVersion`

We need to specify the appropriate ECMA version to features we want to use. For example, if `emcaVersion: 5`, the code below will give some errors.

`` javascript let a = [1, 2, 3, 4] // error due to `let` keyword var b = [...a, 5] // error due to spread syntax ``

The parser can't parse the code because both `let` keyword and spread syntax are just introduced in ES6. Changing `emcaVersion` to 6 or above will simply resolve the errors.

-   `sourceType`

Nowadays, we mostly write everything in modules, then bundle them together so this option, most the time, should be `module`. Another value we can use—as well as the default—is `script`. The difference is whether we can use [JS modules](https://v8.dev/features/modules) or not, i.e., use `import` and `export` keyword. The next time we get this error message `Parsing error: 'import' and 'export' may appear only with 'sourceType: module'`, we know where to look at.

-   `ecmaFeatures.jsx`

There might be additional ES features we want to use, for example [JSX](https://facebook.github.io/jsx/) syntax. We use `ecmaFeatures.jsx: true` to enable this feature. Note that, JSX support from Espree isn't the same as JSX in React so if we want React specific JSX, we should use [eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react) for better result.

If we use another parser, these options are more or less the same. Some might have fewer options, others might have more, but they're all defined under `parserOptions`.

## Environment

Depends on where the code is running, there are different predefined global variables, we have `window`, `document` in browser for example. It would be irritating if [no-undef](https://eslint.org/docs/rules/no-undef) rule is enabled, and ESLint keeps telling us `window` or `document` is not defined.

The `env` option is here to help. By specifying a list of environments, ESLint will know about global variables in these environments, and let us use them without a word.

There's a special environment needed to note, `es6`. It'll implicitly set `parserOptions.ecmaVersion` to 6, and enable all ES6 features except for modules which we still need to use `parserOptions.sourceType: "module"` separately.

# Plugins and Shareable Configs

Having the same configuration for rules over and over again across different projects might be tiresome. Luckily, we can reuse a configuration, and only override rules as needed with `extends`. We call this type of configs, shareable configs, and ESLint already has two for us, `eslint:recommended` and `eslint:all`. Conventionally, ESLint's shareable configs have `eslint-config` prefix so we can easily find them via NPM with [`eslint-config`](https://www.npmjs.com/search?q=keywords:eslint-config) keyword. Among hundreds of results, there're some popular ones, like [eslint-config-airbnb](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb) or [eslint-config-google](https://github.com/google/eslint-config-google), you name it.

Out of the box, ESLint has a bunch of rules to serve different purposes from possible errors, best practices, ES6 to stylistic issues. Moreover, to supercharge its ability, ESLint has a great number of 3rd-party rules provided by almost a thousand of plugins. Similar to shareable configs, ESLint's plugins are prefixed with `eslint-plugin`, and available on NPM with [`eslint-plugin`](https://www.npmjs.com/search?q=keywords:eslint-plugin) keyword.

What a plugin does is to define a set of new rules, and in most cases to expose its own some handy configs. For example, [eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react) gives us two shareable configs, `eslint-plugin-react:recommended` and `eslint-plugin-react:all` just like `eslint:recommended` and `eslint:all`. To use one of them, we need to, firstly, define the plugin name, secondly extend the config.

```javascript
{
  plugins: ["react"],
  extends: "plugin:react/recommended"
}

// Note that we need to prefix the config by `plugin:react`

```

One common question to ask is what plugins or configs to use. While it largely depends on our needs, we can use [Awesome ESLint](https://github.com/dustinspecker/awesome-eslint) as a reference to find useful plugins as well as configs.

# Prettier

We're almost there, we almost go to the end. Last but not least, we'll discuss a popular pair of ESLint, [Prettier](https://github.com/prettier/prettier). In short, Prettier is an opinionated code formatter. Though Prettier can be used alone, integrating it to ESLint enhances the experience a lot, and [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) does this job.

The difference between the usage of Prettier alone and Prettier with ESLint can be summarized to code formatting as an issue. Instead of giving format issues separately, running Prettier with ESLint will treat format issues just like other issues. However, these issues are always fixable, which is equivalent to formatting the code. That's how `eslint-plugin-prettier` works. It runs Prettier, as a rule, behind the scene and compares the code before and after being run through Prettier. Finally, it reports differences as individual ESLint issues. To fix these issues, the plugin simply uses the formatted code from Prettier.

To have this integration, we need to install both `prettier` and `eslint-plugin-prettier`. `eslint-plugin-prettier` also comes with `eslint-plugin-prettier:recommended` config—extends [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier), therefore we also need to install `eslint-config-prettier`—to use.

```javascript
{
  "plugins": ["prettier"],
  "extends": "plugin:prettier/recommended"
}
```

# Conclusion

Code linter or formatter has become de facto standard in software development in general, and ESLint, specifically in front-end development. Its benefit is far beyond what it does technically, it helps developers focus on more important matters. Thanks to delegating code styling to machine, we can avoid opinionated styles on code review, and use that time instead for more meaningful code review. Code quality also benefits from there, more consistent and less error-prone code.
