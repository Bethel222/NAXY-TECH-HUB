from django.urls import path
from . import views
 
urlpatterns = [
    path('', views.index, name='index'),

    path('phones/', views.phones, name='phones'),

    path('iphone/', views.iphone, name='iphone'),

    path('samsung/', views.samsung, name='samsung'),

    path('laptops/', views.laptops, name='laptops'),

    path('earpods/', views.earpods, name='earpods'),

    path('powerbanks/', views.powerbanks, name='powerbanks'),

    path('smartwatch/', views.smartwatch, name='smartwatch'),

    path('tripods/', views.tripods, name='tripods'),

    path('cart/', views.cart, name='cart'),

    path('complaint/', views.complaint, name='complaint'),

    path('pricelist/', views.pricelist, name='pricelist'),

    path('submit-review/', views.submit_review, name='submit_review'),

    path("forgot-password/",views.forgot_password,name="forgot_password" ),

    path('login/', views.login_view, name='login'),   
    
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/add-product/', views.add_product, name='add_product'),
    path('dashboard/add-category/', views.add_category, name='add_category'),
    path('dashboard/delete-product/<int:product_id>/', views.delete_product, name='delete_product'),
    path('dashboard/edit-product/<int:product_id>/', views.edit_product, name='edit_product'),
    path("category/<slug:category_slug>/", views.category_detail, name="category_detail"),


    # Category actions
    path('dashboard/delete-category/<int:category_id>/', views.delete_category, name='delete_category'),
    path('dashboard/edit-category/<int:category_id>/', views.edit_category, name='edit_category'),
   # 1. User submits email to request reset
    # path('forgot-password/', auth_views.PasswordResetView.as_view(template_name='password_reset_form.html',email_template_name='password_reset_email.html',subject_template_name='password_reset_subject.txt'), name='password_reset'),

    # # 2. Page showing "We've emailed you instructions"
    # path('forgot-password/done/', auth_views.PasswordResetDoneView.as_view(template_name='password_reset_done.html'), name='password_reset_done'),

    # # 3. Link clicked in email -> user sets a new password
    # path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name='password_reset_confirm.html'), name='password_reset_confirm'),

    # # 4. Confirmation page after successful reset
    # path('reset/done/', auth_views.PasswordResetCompleteView.as_view(template_name='password_reset_complete.html'), name='password_reset_complete'),
]