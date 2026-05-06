using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public static class ArticleValidationRules
{
    public static IRuleBuilderOptions<T, string> ValidArticleTitle<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

    public static IRuleBuilderOptions<T, string> ValidArticleSummary<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Summary is required")
            .MaximumLength(500).WithMessage("Summary must not exceed 500 characters");

    public static IRuleBuilderOptions<T, string> ValidArticleContent<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Content is required")
            .MinimumLength(20).WithMessage("Content must be at least 20 characters");
}

public class CreateArticleRequestValidator : AbstractValidator<CreateArticleRequest>
{
    public CreateArticleRequestValidator()
    {
        RuleFor(x => x.Title).ValidArticleTitle();
        RuleFor(x => x.Summary).ValidArticleSummary();
        RuleFor(x => x.Content).ValidArticleContent();
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("CategoryId is required");
        RuleFor(x => x.SourceId).GreaterThan(0).WithMessage("SourceId is required");
        RuleFor(x => x.ReadTime).InclusiveBetween(1, 60).When(x => x.ReadTime.HasValue);
    }
}

public class UpdateArticleRequestValidator : AbstractValidator<UpdateArticleRequest>
{
    public UpdateArticleRequestValidator()
    {
        RuleFor(x => x.Title).ValidArticleTitle();
        RuleFor(x => x.Summary).ValidArticleSummary();
        RuleFor(x => x.Content).ValidArticleContent();
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.SourceId).GreaterThan(0);
        RuleFor(x => x.ReadTime).InclusiveBetween(1, 60).When(x => x.ReadTime.HasValue);
    }
}
