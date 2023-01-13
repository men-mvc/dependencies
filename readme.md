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
- Then run `lerna run build`
