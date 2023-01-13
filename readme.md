### Building packages
Inside the root folder
- `npm i` if you are setting up the project for the first time or have added a new npm package
- `lerna run build`

### Publishing packages
- `lerna publish --registry=https://npm.pkg.github.com/`
- To force publishing, use `--force-publish` flag

### Running tests
- `lerna run test`

### Adding a package to another package as dependency locally
- `lerna add @men-mvc/config --scope=@men-mvc/cache` - this adds `@men-mvc/config` to `@men-mvc/cache`
- use `--dev` flag to add the dependency as dev
- Then run `lerna run build`
- **Note** - when Lerna publishes the package, it will also update the version of the dependency to the latest one
