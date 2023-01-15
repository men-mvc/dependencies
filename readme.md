![Alt text](logo.png?raw=true "MEN MVC")
## Men MVC
This is the repository for storing the packages/ dependencies for the Men MVC framework.

### Building & publishing packages
Inside the root folder
- `npm i` if you are setting up the project for the first time or have added a new npm package
- `lerna run test`
- If all the tests are passed, run `lerna run build`
- Commit and push all the changes to git repository
- `lerna publish --registry=https://npm.pkg.github.com/`. Use  `--force-publish` if needed force publishing.

### Running tests
- `lerna run test`

### Adding a package to another package as dependency locally
- `lerna add @men-mvc/config --scope=@men-mvc/cache` - this adds `@men-mvc/config` to `@men-mvc/cache`
- use `--dev` flag to add the dependency as dev
- Then run `lerna run build`
- **Note** - when Lerna publishes the package, it will also update the version of the dependency to the latest one
