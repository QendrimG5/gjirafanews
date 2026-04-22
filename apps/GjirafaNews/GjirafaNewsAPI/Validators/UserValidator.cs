using FluentValidation;
using GjirafaNewsAPI.Models;

namespace GjirafaNewsAPI.Validators
{
    public class UserValidator : AbstractValidator<User>
    {
        public UserValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required");
            RuleFor(x => x.Name).ValidUserName();
            RuleFor(x => x.Email).ValidUserEmail();
            RuleFor(x => x.CreatedAt).NotEmpty().WithMessage("CreatedAt is required");
        }
    }
}
