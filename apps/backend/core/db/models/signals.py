from django.dispatch import Signal

emit_pre_migrate_data = Signal()
emit_post_migrate_data = Signal()
pre_bulk_create = Signal()
post_bulk_create = Signal()
pre_bulk_update = Signal()
post_bulk_update = Signal()
pre_query_update = Signal()
post_query_update = Signal()
pre_list_delete = Signal()
post_list_delete = Signal()
