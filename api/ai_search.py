import os
import torch
import numpy as np
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from sentence_transformers import SentenceTransformer
import pickle
from django.conf import settings
from .models import Product
import logging
from django.db.models import Q

logger = logging.getLogger(__name__)

class AISearchService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.clip_model = None
        self.clip_processor = None
        self.text_model = None
        self.embeddings_cache = {}
        self.cache_dir = os.path.join(settings.BASE_DIR, 'ai_cache')
        os.makedirs(self.cache_dir, exist_ok=True)
        
    def load_models(self):
        """Load AI models"""
        try:
            logger.info("Loading CLIP model...")
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            
            logger.info("Loading text embedding model...")
            self.text_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            logger.info("AI models loaded successfully!")
        except Exception as e:
            logger.error(f"Error loading AI models: {e}")
            raise
    
    def get_image_embedding(self, image):
        """Get embedding for image"""
        if self.clip_model is None:
            self.load_models()
            
        try:
            if isinstance(image, str):
                image = Image.open(image).convert('RGB')
            elif hasattr(image, 'read'):
                image = Image.open(image).convert('RGB')
                
            inputs = self.clip_processor(images=image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                image_features = self.clip_model.get_image_features(**inputs)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
            return image_features.cpu().numpy().flatten()
        except Exception as e:
            logger.error(f"Error getting image embedding: {e}")
            return None
    
    def get_text_embedding(self, text):
        """Get embedding for text"""
        if self.text_model is None:
            self.load_models()
            
        try:
            embedding = self.text_model.encode(text, convert_to_tensor=False)
            return embedding
        except Exception as e:
            logger.error(f"Error getting text embedding: {e}")
            return None
    
    def load_embeddings_cache(self):
        """Load precomputed embeddings"""
        cache_file = os.path.join(self.cache_dir, 'product_embeddings.pkl')
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    self.embeddings_cache = pickle.load(f)
                logger.info(f"Loaded {len(self.embeddings_cache)} cached embeddings")
            except Exception as e:
                logger.error(f"Error loading embeddings cache: {e}")
                self.embeddings_cache = {}
    
    def save_embeddings_cache(self):
        """Save embeddings to cache"""
        cache_file = os.path.join(self.cache_dir, 'product_embeddings.pkl')
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(self.embeddings_cache, f)
            logger.info("Embeddings cache saved successfully")
        except Exception as e:
            logger.error(f"Error saving embeddings cache: {e}")
    
    def precompute_product_embeddings(self):
        """Precompute embeddings for all products"""
        self.load_models()
        self.load_embeddings_cache()
        
        products = Product.objects.all()
        updated_count = 0
        
        for product in products:
            cache_key = f"product_{product.id}"
            
            # Skip if already cached and product not modified
            if cache_key in self.embeddings_cache:
                continue
                
            try:
                # Image embedding
                image_embedding = None
                if product.image:
                    image_path = os.path.join(settings.MEDIA_ROOT, str(product.image))
                    if os.path.exists(image_path):
                        image_embedding = self.get_image_embedding(image_path)
                
                # Text embedding (name + description)
                text_content = f"{product.name} {product.description or ''}"
                text_embedding = self.get_text_embedding(text_content)
                
                self.embeddings_cache[cache_key] = {
                    'image_embedding': image_embedding,
                    'text_embedding': text_embedding,
                    'product_id': product.id
                }
                
                updated_count += 1
                if updated_count % 10 == 0:
                    logger.info(f"Processed {updated_count} products...")
                    
            except Exception as e:
                logger.error(f"Error processing product {product.id}: {e}")
        
        self.save_embeddings_cache()
        logger.info(f"Precomputed embeddings for {updated_count} products")
    
    def search_by_image(self, image, limit=5):
        """Enhanced image search with better similarity calculation"""
        self.load_embeddings_cache()
        
        query_embedding = self.get_image_embedding(image)
        if query_embedding is None:
            return []
        
        similarities = []
        
        for cache_key, data in self.embeddings_cache.items():
            if data['image_embedding'] is not None:
                # Calculate cosine similarity
                similarity = np.dot(query_embedding, data['image_embedding']) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(data['image_embedding'])
                )
                # Convert from [-1, 1] to [0, 1]
                similarity = (similarity + 1) / 2
                similarities.append((data['product_id'], float(similarity)))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for product_id, similarity in similarities[:limit]:
            try:
                product = Product.objects.get(id=product_id)
                compatibility_percent = min(100, max(0, int(similarity * 100)))
                results.append({
                    'product': product,
                    'similarity': similarity,
                    'compatibility_percent': compatibility_percent
                })
            except Product.DoesNotExist:
                continue
        
        return results
    
    def search_by_text(self, query, limit=10):
        """Enhanced text search with better accuracy"""
        logger.info(f"Starting enhanced text search for: '{query}'")
        
        # Improved category keywords with more variations
        category_keywords = {
            'dress': {
                'primary': ['váy'],
                'secondary': ['dress', 'skirt', 'đầm'],
                'exclude': ['áo', 'quần', 'giày', 'shoe', 'pant', 'shirt']
            },
            'top': {
                'primary': ['áo'],
                'secondary': ['shirt', 'top', 'blouse', 'hoodie', 'sweater'],
                'exclude': ['váy', 'quần', 'giày', 'dress', 'pant', 'shoe']
            },
            'bottom': {
                'primary': ['quần'],
                'secondary': ['pants', 'trouser', 'jean', 'short'],
                'exclude': ['váy', 'áo', 'giày', 'dress', 'shirt', 'shoe']
            },
            'shoes': {
                'primary': ['giày'],
                'secondary': ['shoe', 'boot', 'sandal', 'sneaker'],
                'exclude': ['váy', 'áo', 'quần', 'dress', 'shirt', 'pant']
            }
        }
        
        # Enhanced category detection
        query_lower = query.lower()
        search_category = None
        category_confidence = 0
        
        for category, terms in category_keywords.items():
            # Check primary keywords (high confidence)
            primary_matches = sum(1 for term in terms['primary'] if term in query_lower)
            # Check secondary keywords (medium confidence)
            secondary_matches = sum(1 for term in terms['secondary'] if term in query_lower)
            # Check exclude keywords (negative confidence)
            exclude_matches = sum(1 for term in terms['exclude'] if term in query_lower)
            
            confidence = (primary_matches * 3) + (secondary_matches * 1) - (exclude_matches * 2)
            
            if confidence > category_confidence:
                category_confidence = confidence
                search_category = category
        
        logger.info(f"Detected category: {search_category} (confidence: {category_confidence})")
        
        self.load_embeddings_cache()
        
        query_embedding = self.get_text_embedding(query)
        if query_embedding is None:
            return []
        
        similarities = []
        
        # Enhanced product filtering
        filtered_product_ids = None
        if search_category and category_confidence > 0:
            terms = category_keywords[search_category]
            
            # Build complex query
            name_queries = Q()
            desc_queries = Q()
            
            # Primary terms (must match)
            for term in terms['primary']:
                name_queries |= Q(name__icontains=term)
                desc_queries |= Q(description__icontains=term)
            
            # Secondary terms (can match)
            for term in terms['secondary']:
                name_queries |= Q(name__icontains=term)
                desc_queries |= Q(description__icontains=term)
            
            # Exclude terms (must not match)
            exclude_queries = Q()
            for term in terms['exclude']:
                exclude_queries |= Q(name__icontains=term)
            
            filtered_products = Product.objects.filter(
                (name_queries | desc_queries)
            ).exclude(exclude_queries).values_list('id', flat=True)
            
            filtered_product_ids = set(filtered_products)
            logger.info(f"Filtered to {len(filtered_product_ids)} products in category")
        
        # Calculate similarities with enhanced scoring
        for cache_key, data in self.embeddings_cache.items():
            if data['text_embedding'] is not None:
                # Apply category filter
                if filtered_product_ids and data['product_id'] not in filtered_product_ids:
                    continue
                
                # Calculate base similarity
                similarity = np.dot(query_embedding, data['text_embedding']) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(data['text_embedding'])
                )
                
                # Enhanced scoring with keyword matching bonus
                try:
                    product = Product.objects.get(id=data['product_id'])
                    product_text = f"{product.name} {product.description or ''}".lower()
                    
                    # Keyword matching bonus
                    query_words = query_lower.split()
                    matched_words = sum(1 for word in query_words if word in product_text)
                    keyword_bonus = (matched_words / len(query_words)) * 0.2
                    
                    # Category relevance bonus
                    category_bonus = 0
                    if search_category:
                        terms = category_keywords[search_category]
                        primary_in_product = sum(1 for term in terms['primary'] if term in product_text)
                        category_bonus = primary_in_product * 0.1
                    
                    # Final similarity with bonuses
                    enhanced_similarity = similarity + keyword_bonus + category_bonus
                    enhanced_similarity = min(1.0, max(-1.0, enhanced_similarity))
                    
                    # Convert to [0, 1] range
                    final_similarity = (enhanced_similarity + 1) / 2
                    
                    similarities.append((data['product_id'], float(final_similarity)))
                    
                except Product.DoesNotExist:
                    continue
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Build results with better compatibility calculation
        results = []
        for i, (product_id, similarity) in enumerate(similarities[:limit]):
            try:
                product = Product.objects.get(id=product_id)
                
                # More realistic compatibility percentage
                base_compatibility = int(similarity * 100)
                
                # Adjust based on ranking position
                position_penalty = min(10, i * 2)  # Top results get less penalty
                final_compatibility = max(45, base_compatibility - position_penalty)
                
                results.append({
                    'product': product,
                    'similarity': similarity,
                    'compatibility_percent': final_compatibility
                })
            except Product.DoesNotExist:
                continue
        
        logger.info(f"Returning {len(results)} enhanced results")
        return results

# Global instance
ai_search_service = AISearchService()




