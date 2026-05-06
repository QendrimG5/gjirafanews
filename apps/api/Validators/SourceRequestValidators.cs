using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public static class SourceValidationRules
{
    public static IRuleBuilderOptions<T, string> ValidSourceName<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Name is required")
            .MaximumLength(120).WithMessage("Name must not exceed 120 characters");

    public static IRuleBuilderOptions<T, string> ValidSourceUrl<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Url is required")
            .MaximumLength(500).WithMessage("Url must not exceed 500 characters")
            .Must(BeValidAbsoluteUrl).WithMessage("Url must be a valid absolute http(s) URL");

    public static IRuleBuilderOptions<T, string?> ValidOptionalLogoUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(500).WithMessage("Logo URL must not exceed 500 characters")
            .Must(s => string.IsNullOrEmpty(s) || BeValidAbsoluteUrl(s))
            .WithMessage("Logo URL must be a valid absolute http(s) URL");

    private static bool BeValidAbsoluteUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u)
        && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps);
}

public class CreateSourceRequestValidator : AbstractValidator<CreateSourceRequest>
{
    public CreateSourceRequestValidator()
    {
        RuleFor(x => x.Name).ValidSourceName();
        RuleFor(x => x.Url).ValidSourceUrl();
        RuleFor(x => x.LogoUrl).ValidOptionalLogoUrl();
    }
}

public class UpdateSourceRequestValidator : AbstractValidator<UpdateSourceRequest>
{
    public UpdateSourceRequestValidator()
    {
        RuleFor(x => x.Name).ValidSourceName();
        RuleFor(x => x.Url).ValidSourceUrl();
        RuleFor(x => x.LogoUrl).ValidOptionalLogoUrl();
    }
}
