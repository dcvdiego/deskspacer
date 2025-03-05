# Contributing

## Issues

Issues are very valuable to this project.

- Ideas are a valuable source of contributions others can make
- Problems show where this project is lacking
- With a question you show where contributors can improve the user experience

Thank you for creating them.

## Pull Requests

Pull requests are a great way to get your ideas into this repository.

When deciding if I merge in a pull request I look at the following
things:

### Does it state intent

You should be clear which problem you're trying to solve with your
contribution.

For example:

> Add link to code of conduct in README.md

Doesn't tell me anything about why you're doing that

> Add link to code of conduct in README.md because users don't always
> look in the CONTRIBUTING.md

Tells me the problem that you have found, and the pull request shows me
the action you have taken to solve it.

### Is it of good quality

- There are no spelling mistakes
- It reads well
- For english language contributions: Has a good score on
    [Grammarly](https://www.grammarly.com) or [Hemingway
    App](https://www.hemingwayapp.com/)

### Does it move this repository closer to the author's vision for the repository

The aim of this repository is:

- To create a native-feeling cross-platform 3D application with a use-case, i.e. features need to have intent and they need to keep performance in mind
- Keep it as simple as possible, reutilizing code wherever possible and complying with existing ESLint and Prettier rules
- It be a good example of the power of web engineering!

### Does it follow the contributor covenant

This repository has a [code of conduct](codeofconduct.md), I will remove things that do not respect it.

## After forking/cloning the app

This project uses [semantic commits](https://conventionalcommits.org) and [semver](https://semver.org).

To get started, make sure you have [Node](https://nodejs.org), [PNPM](https://pnpm.io), and [.NET](https://dotnet.microsoft.com/en-us/download/dotnet/9.0) installed. You also need a docker tool. I use [Podman](https://podman.io/) but Docker works too, keep in mind the docs will follow Podman.

### Front-End Development

Install dependencies for the frontend with:

```zsh
cd frontend
pnpm i
```

To run the development server (assuming you are in frontend folder):

```bash
pnpm dev
```

Keep in mind there are Prettier and ESLint rules in place. The only CI in place is a Husky for this and TypeScript compiler as testing would be very time consuming. Please adhere to these rules.

### Back-End Development

Coming Soon

#### 3D Development Precautions

Most if not all of these models were taken from the Deskspacing.com repository. A lot of work was put into these models, but the scale ratio is actually 1m=1in. I.e. if you import any model into a 3D software like Blender you will find a 25inch monitor is actually 25m instead! This means any new model that has accurate measurements need to be scaled by 39.3701 for it to be accurate in comparison to existing models. This is also the basis for the measurement tool.

This MD is still work in progress, the app's features are my priority but if there is a bigger move to collaboration by the community I will make sure I keep this up to date.
