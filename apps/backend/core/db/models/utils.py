from django.core.exceptions import ImproperlyConfigured

try:
    from sequences import Sequence
except ImportError as e:
    raise ImproperlyConfigured("Error loading sequences module: %s" % e)


def generate_unique_sequence(field, instance, manager=None):
    if not manager:
        manager = field.model._default_manager
    # keep changing the  sequence until it is unique
    sequence_number = Sequence(field.sequence_name)
    sequence = next(sequence_number)
    if field.format:
        sequence = f'{sequence:{field.format}}'
    lookups = {field.name: sequence}
    if field.unique_with:
        for field_name in field.unique_with:
            lookups[field_name] = getattr(instance, field_name)
    rivals = manager.filter(**lookups)
    if instance.pk:
        rivals = rivals.exclude(pk=instance.pk)

    if not rivals:
        # the slug is unique, no model uses it
        return sequence
    return generate_unique_sequence(field=field, instance=instance, manager=manager)
