from django import forms
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Auction
from .forms import AuctionForm


def index(request):
    auctions = Auction.objects.all()
    return render(request, "auctions/index.html", {
        "auctions": auctions
    })

def login_view(request):
    # get the value of the next url
    next = request.GET.get('next', '/')
    if request.method == "POST":
        next_url = request.POST["next"]
        
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(next_url) 
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        # pass the next url into the form as an hidden attribute to redirect on the correct page the user wanted
        return render(request, "auctions/login.html", {
            'next': next
        })


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def create_listing(request):
    if request.method == "POST":
        form = AuctionForm(request.POST)

        if form.is_valid():
            auction = form.save(commit=False)
            auction.seller = request.user
            auction.save()
            return(HttpResponseRedirect(reverse("index")))
    
    else:
        form = AuctionForm()
        return render(request, "auctions/create.html", {
            "form": form
        })

@login_required
def listing(request, id):
    try:
        listing = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        listing = None

    return render(request, "auctions/listing.html", {
        "listing": listing
    })