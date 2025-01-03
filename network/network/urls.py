from django.urls import path

from . import views

urlpatterns = [
    # diplay routes
    path("", views.index, name="index"),
    path("following", views.index, name="following"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("detail/<int:id>", views.detail, name="detail"),

    # API routes
    path("posts", views.posts, name="all_posts"),
    path("posts/filter/<str:filter>", views.posts, name="filtered_post"),
    path("posts/<int:id>", views.post_id, name="post_id"),
    path("posts/<int:id>/like", views.like, name="like"),
    path("posts/<int:id>/follow", views.follow_post, name="follow_post"),
    # path("posts/<int:id>/comments", views.comments, name="comments"),
]
