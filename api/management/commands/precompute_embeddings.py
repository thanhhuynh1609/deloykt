from django.core.management.base import BaseCommand
from api.ai_search import ai_search_service

class Command(BaseCommand):
    help = 'Precompute embeddings for all products'

    def handle(self, *args, **options):
        self.stdout.write('Starting to precompute embeddings...')
        try:
            ai_search_service.precompute_product_embeddings()
            self.stdout.write(
                self.style.SUCCESS('Successfully precomputed embeddings!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {e}')
            )