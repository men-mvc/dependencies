### Checklist for adding a new env variable/ config field

- `src/types/baseConfig.ts` - add the field and update `CONFIG_VARIABLES_COUNT` (don't forget to update the comment too)
- `src/globals.ts` - add the field with default value to `coreTestConfig` if needed for tests (this is not related to specifying default value for app project. For the app project, it is done in the `config/default.json`)
- `src/appConfigUtility` - assign the `.env` variable to the right prop of the config object
- `tests/unit/fakeConfigs/complete-env-vars.json` - add the env variable
- `tests/unit/fakeConfigs/default.json` - add the field with default value if needed
- Then start fixing the tests
- `src/baseConfigUtility.ts` - Last but not least - consider adding the validation if needed
- ensure that `tests/unit/fakeConfigs/default.json` have the required fields for app project

### In the app

- specify the `.env` variable in the `config/custom-environment-variables.json` file
- declare the field in the `config/default.json` file
- specify default value in the `config/default.json` file if needed
