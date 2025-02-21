import { editPost, fetchPosts, follow, isAuthenticated, like, postNewPost, showAlert } from './api.js';

// -------------------------------------------Builder functions---------------------------------------
// Create a new element and his listener containing all the informations from a post.
export function createPostElement(post){
    // Create the new element
    var newPost = document.createElement('div');
    newPost.className = 'col-lg-7';
    newPost.classList.add('postCard');
    newPost.innerHTML = `
        <div class="card mb-3">
            <div class="card-header fw-bold justify-content-between d-flex">
                <a href='/profile/${post.userId}' class='text-dark'>${post.user}</a>
                <div>
                    ${post.is_author? '<a href="" class="edit-button">Edit</a>' : ''}
                    ${post.is_author? '<a href="" class="confirm-button" hidden>Confirm</a>' : ''}
                </div>
            </div>
            <div class="card-body">
                <p class="card-text">
                    <div class='post-body'>${post.content}</div>
                    <textarea class="form-control edit-area" hidden rows="3">${post.content}</textarea>
                </p>
                <div class="container text-end">
                    <button class="btn p-1 btn-outline-primary follow-button ${post.followed? 'active' : ''}">${post.followed? 'Unfollow' : 'Follow'}</button>
                </div>
            </div>
            <div class="card-footer text-body-secondary">
                <div class="d-flex justify-content-between">
                    <button class="btn p-0 like-button ${post.liked? 'text-danger' : ''}"><i class="fa fa-heart postHeart"></i> <span class="postLikes">${post.likes}<span></button>
                    <a href="/detail/${post.id}"><button class="btn p-0 postComments">${post.comments} Comments</button></a>
                    <div>${post.created}</div>
                </div>
            </div>
        </div>
        `;
    
    // query selectors
    const likeButton =  newPost.querySelector('.like-button');
    const followButton = newPost.querySelector('.follow-button');
    const editButton = newPost.querySelector('.edit-button');
    const confirmButton = newPost.querySelector('.confirm-button');
    const postBody = newPost.querySelector('.post-body');
    const editArea = newPost.querySelector('.edit-area');

    // function to toggle editing state
    function toggleEditState() {
        if (editButton.innerHTML === 'Edit') {
            editButton.innerHTML = 'Cancel';
            confirmButton.hidden = false;
            postBody.hidden = true;
            editArea.hidden = false;
        } else {
            editButton.innerHTML = 'Edit';
            postBody.hidden = false;
            editArea.hidden = true;
            confirmButton.hidden = true;
        }
    }
    
    // deactivate the follow button if the user is the author of the post
    if (post.is_author){

        followButton.disabled = true;
    }

    // delete the follow button if the user is on a profile page
    if (window.location.pathname.includes('profile')) {
        followButton.remove();
    }

    // Add the event listener to the like button
    likeButton.addEventListener('click', async () => {

        // get the total likes if on a profile page
        const totalElement = document.querySelector('.total-likes');
        let total;
        if (totalElement){
            total = parseInt(totalElement.innerHTML);
        }
    
        if (await isAuthenticated()){
            try {
                const data = await like(post.id);

                // if the post is liked, update the class and the count, update also the total likes on a profile page
                likeButton.querySelector('.postLikes').textContent = data.likesCount;
                if (data.action === 'like'){
                    likeButton.classList.add('text-danger');
                    if (totalElement){
                        totalElement.innerHTML = total + 1;
                    }

                } else if (data.action === 'unlike'){
                    likeButton.classList.remove('text-danger');
                    if (totalElement){
                        totalElement.innerHTML = total - 1;
                    }
                }
            } catch (error) {
                console.error('Error while liking the post: ', error.message);
                showAlert('Error while liking the post', 'danger');
            }
        } else {
            showAlert('You must be authenticated to like a post', 'danger');
        }
    });
        

    // add the event listener to the follow button
    followButton.addEventListener('click', async () => {
        if (await isAuthenticated()){
            try {
                const data = await follow(post.userId);
                
                // if the post is unfollowed in the following menu, reload the first page
                if (data.action === 'unfollow') {
                    showAlert(`You are not following ${post.user} anymore!`, 'warning');
                } else {
                    showAlert(`You are following ${post.user}!`, 'success');

                }
                update_page(1);
                
            } catch (error) {
                console.error('Error while following the post: ', error.message);
                showAlert(`${error.message}`, 'danger');
            }
        } else {
            showAlert('You must be authenticated to follow a post', 'danger');
        }
    });

    // add the event listener to the edit button
    editButton?.addEventListener('click', (event) => {
        event.preventDefault();

        // replace the body by a textfield and update the Edit fonction to allow the toggle between views
        toggleEditState();
    });

    // add the event listener to confirm the modification
    confirmButton?.addEventListener('click', async (event) => {
        event.preventDefault();
        
        // Get the value of the edited text
        let text = editArea.value;
        if (!text){
            showAlert("The post cannot be empty", "danger");
            return;
        }

        // send the query to the api
        await editPost(text, post.id)

        // restore the default view of the post with the edited text
        toggleEditState();
        postBody.innerHTML = text; 
        showAlert("Post edited!");
   }) 
    return newPost;
}


// Create a pagination button corresponding to the desired page number and add the corresponding event listener if not already created
export function createPageItem(pageNumber){

    const pagination = document.querySelector('#pagination');

    // Check if the page number already exists
    if (!pagination.querySelector(`#page-${pageNumber}`)) {

        // Get the pagination element, the 'next button' and create the new page
        const nextButton = document.querySelector('#next-page');

        const newPage = document.createElement('li');
        newPage.classList.add('page-item');
        newPage.innerHTML = `<a class="page-link" id="page-${pageNumber}">${pageNumber}</a>`

        // Append the new page number to the pagination before the 'next' button
        pagination.insertBefore(newPage, nextButton)

        // create the event listener to update the corresponding page when clicked
        newPage.addEventListener('click', async () => {
            update_page(pageNumber);
        });
    }
}

// Update pagination boutton Previous and Next (disable or active) with data to set-up the next page and page number
export function updatePaginationButtons(page, total_pages){
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // refresh previous / next button
    if (page === 1){
        previousButton.classList.add('disabled');
        previousButton.dataset.page = page;
    } else {
        previousButton.classList.remove('disabled');
        previousButton.dataset.page = page - 1;
    }

    if (page === total_pages) {
        nextButton.classList.add('disabled');
        nextButton.dataset.page = page;
    } else {
        nextButton.classList.remove('disabled');
        nextButton.dataset.page = page + 1;
    }

    // Make active the current page
    for (var i = 1; i <= total_pages; i++){
        const pagebutton = document.querySelector(`#page-${i}`);
        if (i === page) {
            pagebutton?.classList.add('active')
        } else {
            pagebutton?.classList.remove('active')
        }
    }

    // Remove the pagination buttons exceeding the total pages
    let excess_counter = 1;
    let excess_page = document.querySelector(`#page-${total_pages + excess_counter}`);
    while (excess_page !== null) {
        excess_page.remove();
        excess_counter++;
        excess_page = document.querySelector(`#page-${total_pages + excess_counter}`);
}
}

// update the page by displaying the new posts and pagination
export async function update_page(page){
    const data = await fetchPosts(page);
    console.log(data)
    // Check if there are no posts to display
    if (data.posts.length === 0){
        postContainer.innerHTML = `<div class="alert alert-info text-center" role="alert">No posts to display</div>`;
        updatePaginationButtons(data.page, data.total_pages);
        return;
    }

    // Remove all posts from the page
    postContainer.innerHTML='';

    // load the new posts
    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    });

    // create pagination buttons
    for (let i = 1; i <= data.total_pages; i++){
        createPageItem(i);
    }

    // update pagination buttons diplays
    updatePaginationButtons(data.page, data.total_pages);
}


// update the front-end of the follow button when clicked on the comment and profile page
export function updateFollowButton(response, button)  {
    if (response.action == 'follow') {
        showAlert('You are now following this user', 'success');
        button.innerHTML = 'Unfollow';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
        
    } else if (response.action == 'unfollow') {
        button.innerHTML = 'Follow';
        button.classList.add('btn-outline-primary');
        button.classList.remove('btn-primary');
        showAlert('You are not following this user anymore', 'warning');
    }
}