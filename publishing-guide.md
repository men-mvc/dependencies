# MEN MVC dependencies

Useful tips and instructions.

## Building and Publishing Packages

To build and publish packages, follow these steps:

1. Ensure that you are on the `main` branch.
2. If you are setting up the project for the first time or have added a new npm package, run `npm i`.
3. Run `lerna run test`.
4. If all the tests pass, run `lerna run build`.
5. Commit and push all changes to your git repository.
6. To publish the packages, run `lerna publish --registry=https://registry.npmjs.org` or `npm run publish`. Use `--force-publish` if you need to force publishing.

## Creating Tags

Lerna takes care of creating tags for each version. If you want to create your own tags in addition to the ones Lerna creates, follow these steps:

1. Run `git tag {{TAG}}`.
2. Run `git push origin --tag`.

## Running Tests

To run tests, run `lerna run test`.

## Adding a Package as a Dependency Locally

To add a package as a dependency locally to another package, follow these steps:

1. Run `lerna add @men-mvc/config --scope=@men-mvc/cache`. This adds `@men-mvc/config` to `@men-mvc/cache`.
2. Use the `--dev` flag to add the dependency as a dev dependency.
3. Then run `lerna run build`.
4. **Note** - when Lerna publishes the package, it will also update the version of the dependency to the latest one.
