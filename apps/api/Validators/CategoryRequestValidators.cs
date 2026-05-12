using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public static class CategoryValidationRules
{
    private const string SlugPattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    private const string ColorPattern = "^#[0-9A-Fa-f]{6}$";

    public static IRuleBuilderOptions<T, string> ValidCategoryName<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Name is required")
            .MaximumLength(80).WithMessage("Name must not exceed 80 characters");

    public static IRuleBuilderOptions<T, string> ValidCategorySlug<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Slug is required")
            .MaximumLength(80).WithMessage("Slug must not exceed 80 characters")
            .Matches(SlugPattern).WithMessage("Slug must be lowercase kebab-case (a-z, 0-9, hyphens)");

    public static IRuleBuilderOptions<T, string> ValidCategoryColor<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Color is required")
            .Matches(ColorPattern).WithMessage("Color must be a hex value like #1A2B3C");
}

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).ValidCategoryName();
        RuleFor(x => x.Slug).ValidCategorySlug();
        RuleFor(x => x.Color).ValidCategoryColor();
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).ValidCategoryName();
        RuleFor(x => x.Slug).ValidCategorySlug();
        RuleFor(x => x.Color).ValidCategoryColor();
    }
}
