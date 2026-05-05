using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public class InitiateMultipartUploadRequestValidator : AbstractValidator<InitiateMultipartUploadRequest>
{
    public InitiateMultipartUploadRequestValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(512);
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(255);
        RuleFor(x => x.PartCount).InclusiveBetween(1, 10_000);
    }
}

public class CompleteMultipartUploadRequestValidator : AbstractValidator<CompleteMultipartUploadRequest>
{
    public CompleteMultipartUploadRequestValidator()
    {
        RuleFor(x => x.Key).NotEmpty();
        RuleFor(x => x.UploadId).NotEmpty();
        RuleFor(x => x.Parts).NotEmpty();
        RuleForEach(x => x.Parts).ChildRules(p =>
        {
            p.RuleFor(x => x.PartNumber).InclusiveBetween(1, 10_000);
            p.RuleFor(x => x.ETag).NotEmpty();
        });
    }
}

public class AbortMultipartUploadRequestValidator : AbstractValidator<AbortMultipartUploadRequest>
{
    public AbortMultipartUploadRequestValidator()
    {
        RuleFor(x => x.Key).NotEmpty();
        RuleFor(x => x.UploadId).NotEmpty();
    }
}
