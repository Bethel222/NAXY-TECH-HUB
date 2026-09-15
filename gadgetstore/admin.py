from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    CustomerProfile, 
    Category, 
    Product, 
    Order, 
    Laptop, 
    Phone, 
    Accessory
)

# Optional: Uncomment to enable custom admin branding
# admin.site.site_header = "Naxy Tech Gadgets Management"
# admin.site.site_title = "Naxy Tech Admin Portal"
# admin.site.index_title = "Store Overview & Controls"


# --- CUSTOM USER ADMIN ---

class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'


class CustomUserAdmin(BaseUserAdmin):
    inlines = (CustomerProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_phone')

    def get_phone(self, instance):
        return instance.profile.phone if hasattr(instance, 'profile') else '-'
    get_phone.short_description = 'Phone Number'


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# --- CATEGORY & ORDER ADMIN ---

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'id')
    list_editable = ('status',)


# --- MAIN PRODUCT ADMIN ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)
    list_editable = ('price', 'stock', 'is_active')


# --- PROXY MODEL ADMINS FOR SEPARATE SECTIONS ---

@admin.register(Laptop)
class LaptopAdmin(admin.ModelAdmin):
    exclude = ('category',)
    list_display = ('name', 'price', 'stock', 'is_active')
    search_fields = ('name',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(category='laptop')

    def save_model(self, request, obj, form, change):
        obj.category = 'laptop'
        super().save_model(request, obj, form, change)


@admin.register(Phone)
class PhoneAdmin(admin.ModelAdmin):
    exclude = ('category',)
    list_display = ('name', 'price', 'stock', 'is_active')
    search_fields = ('name',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(category='phone')

    def save_model(self, request, obj, form, change):
        obj.category = 'phone'
        super().save_model(request, obj, form, change)


@admin.register(Accessory)
class AccessoryAdmin(admin.ModelAdmin):
    exclude = ('category',)
    list_display = ('name', 'price', 'stock', 'is_active')
    search_fields = ('name',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(category='accessory')

    def save_model(self, request, obj, form, change):
        obj.category = 'accessory'
        super().save_model(request, obj, form, change)