using FluentValidation;

namespace GjirafaNewsAPI.Validators
{
    public static class UserValidationRules
    {
        public static IRuleBuilderOptions<T, string> ValidUserName<T>(this IRuleBuilder<T, string> rule) =>
            rule.NotEmpty().WithMessage("Name is required")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        public static IRuleBuilderOptions<T, string> ValidUserEmail<T>(this IRuleBuilder<T, string> rule) =>
            rule.NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email must be a valid email address")
                .MaximumLength(254).WithMessage("Email must not exceed 254 characters");
    }
}
