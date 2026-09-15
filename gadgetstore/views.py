from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.admin.views.decorators import staff_member_required
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.text import slugify
from django.views.decorators.http import require_POST
from email.mime.image import MIMEImage

from .models import Product, Category, Order
from .forms import ProductForm


# --- PUBLIC & AUTH VIEWS ---

def email_is_configured():
    return (
        settings.EMAIL_HOST_USER
        and settings.EMAIL_HOST_PASSWORD
        and settings.EMAIL_HOST_USER != "yourgmail@gmail.com"
        and settings.EMAIL_HOST_PASSWORD != "your-app-password"
    )


def send_welcome_email(user):
    if not user.email or not email_is_configured():
        return

    context = {
        "customer_name": user.first_name or "there",
        "brand_name": "Naxy Tech Gadgets",
        "whatsapp_number": "07049763653",
    }
    html_message = render_to_string("emails/welcome_email.html", context)
    text_message = strip_tags(html_message)
    email = EmailMultiAlternatives(
        subject="Welcome to Naxy Tech Gadgets",
        body=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_message, "text/html")

    logo_path = settings.BASE_DIR / "static" / "images" / "NAXY LOGO.png"
    if logo_path.exists():
        with logo_path.open("rb") as logo_file:
            logo = MIMEImage(logo_file.read())
            logo.add_header("Content-ID", "<naxy_logo>")
            logo.add_header("Content-Disposition", "inline", filename="naxy-logo.png")
            email.attach(logo)

    try:
        email.send(fail_silently=True)
    except Exception:
        pass

def index(request):
    return render(request, "index.html")


def login_view(request):
    if request.user.is_authenticated:
        return redirect("index")

    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.first_name}!")
            return redirect("index")

        messages.error(request, "Invalid email or password.")

    return render(request, "login.html")


def signup_view(request):
    if request.user.is_authenticated:
        return redirect("index")

    if request.method == "POST":
        fullname = request.POST.get("fullname")
        email = request.POST.get("email", "").strip().lower()
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("signup")

        if len(password1) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return redirect("signup")

        if User.objects.filter(username=email).exists():
            messages.error(request, "An account with this email already exists.")
            return redirect("signup")

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password1
        )
        user.first_name = fullname
        user.save()
        send_welcome_email(user)

        messages.success(request, "Account created successfully. Please login.")
        return redirect("login")

    return render(request, "signup.html")


def logout_view(request):
    logout(request)
    return redirect("login")


def forgot_password(request):
    return render(request, 'forgot_password.html')


# --- CATEGORY PAGES ---

@login_required(login_url="login")
def phones(request):
    # Matches 'phone' category choice in models.py
    products = Product.objects.filter(category='phone')
    return render(request, 'phones.html', {'products': products})


@login_required(login_url="login")
def laptops(request):
    # Matches 'laptop' category choice in models.py
    products = Product.objects.filter(category='laptop')
    return render(request, 'laptops.html', {'products': products})


@login_required(login_url="login")
def iphone(request):
    return render(request, "iphone.html")


@login_required(login_url="login")
def samsung(request):
    return render(request, "samsung.html")


@login_required(login_url="login")
def earpods(request):
    return render(request, "earpods.html")


@login_required(login_url="login")
def powerbanks(request):
    return render(request, "powerbanks.html")


@login_required(login_url="login")
def smartwatch(request):
    return render(request, "smartwatch.html")


@login_required(login_url="login")
def tripods(request):
    return render(request, "tripods.html")


# --- ADMIN DASHBOARD & PRODUCT/CATEGORY MANAGEMENT ---

@staff_member_required
@staff_member_required
def admin_dashboard(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "Product added successfully!")
            return redirect('admin_dashboard')
    else:
        form = ProductForm()

    products = Product.objects.all().order_by('-id')
    orders = Order.objects.all().order_by('-id')
    users = User.objects.all()

    context = {
        'products': products,
        'orders': orders,
        'users': users,
        'categories': Category.objects.all(),
        'product_categories': Product.CATEGORY_CHOICES,
        'product_form': form,
        
        # Explicit counts executed efficiently via SQL COUNT queries
        'total_products': products.count(),
        'total_orders': orders.count(),
        'total_users': users.count(),
    }

    return render(request, 'admin_dashboard.html', context)


@staff_member_required
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "Product added successfully!")
        else:
            messages.error(request, "Error adding product. Please check form fields.")
    return redirect('admin_dashboard')


@staff_member_required
def add_category(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        slug_input = request.POST.get('slug', '').strip()
        slug = slugify(slug_input) if slug_input else slugify(name)

        if Category.objects.filter(slug=slug).exists():
            messages.error(request, f"A category with slug '{slug}' already exists.")
        else:
            Category.objects.create(name=name, slug=slug)
            messages.success(request, f"Category '{name}' created successfully!")

    return redirect('admin_dashboard')


def category_detail(request, category_slug):
    category = get_object_or_404(Category, slug=category_slug)
    products = Product.objects.filter(category=category.slug)
    
    context = {
        'category': category,
        'products': products,
    }
    return render(request, 'category_detail.html', context)


@require_POST
@staff_member_required
def delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    messages.success(request, "Product deleted successfully.")
    return redirect('admin_dashboard')


@require_POST
@staff_member_required
def delete_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    category.delete()
    messages.success(request, "Category deleted successfully.")
    return redirect('admin_dashboard')


@require_POST
@staff_member_required
def edit_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    product.name = request.POST.get('name')
    product.category = request.POST.get('category')
    product.price = request.POST.get('price')
    product.stock = request.POST.get('stock')
    product.description = request.POST.get('description', '')

    if 'image' in request.FILES:
        product.image = request.FILES['image']

    product.save()
    messages.success(request, "Product updated successfully.")
    return redirect('admin_dashboard')


@require_POST
@staff_member_required
def edit_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    
    name = request.POST.get('name', '').strip()
    slug_input = request.POST.get('slug', '').strip()
    new_slug = slugify(slug_input) if slug_input else slugify(name)

    if Category.objects.filter(slug=new_slug).exclude(id=category.id).exists():
        messages.error(request, f"Category slug '{new_slug}' is already taken.")
    else:
        category.name = name
        category.slug = new_slug
        category.save()
        messages.success(request, "Category updated successfully.")

    return redirect('admin_dashboard')


# --- USER INTERACTION VIEWS ---

@login_required(login_url="login")
def cart(request):
    return render(request, "cart.html")


@login_required(login_url="login")
def complaint(request):
    return render(request, "complaint.html")


@login_required(login_url="login")
def pricelist(request):
    return render(request, "pricelist.html")


def submit_review(request):
    return render(request, "submit-review.html")
