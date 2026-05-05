using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public class PublishMessageRequestValidator : AbstractValidator<PublishMessageRequest>
{
    public PublishMessageRequestValidator()
    {
        RuleFor(x => x.Value).NotEmpty().MaximumLength(64 * 1024);
        RuleFor(x => x.Key).MaximumLength(256);
    }
}
