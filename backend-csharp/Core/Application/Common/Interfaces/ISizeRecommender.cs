namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>AI ölçü tövsiyə mühərriki — istifadəçi ölçülərinə + məhsula görə ölçü təklif edir.</summary>
public interface ISizeRecommender
{
    object Recommend(User user, Product product);
}
