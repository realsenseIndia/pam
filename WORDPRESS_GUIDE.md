# How to Run "Personal Accounts Manager" on WordPress

Since this is a modern Web App (HTML/CSS/JS), you don't need to convert it into a complex WordPress plugin. The easiest way is to upload it to your site and embed it.

Follow these simple steps:

## Step 1: Download the App
1.  I have updated the **`PersonalAccountsManager_Setup.zip`** file in your project folder.
2.  This zip file contains all the latest features (Diary & Notepad).

## Step 2: Install a File Manager Plugin
1.  Log in to your **WordPress Admin Dashboard** (`yourwebsite.com/wp-admin`).
2.  Go to **Plugins** > **Add New**.
3.  Search for **"WP File Manager"**.
4.  **Install** and **Activate** the plugin (by mndpsingh287 is a popular free one).

## Step 3: Upload the App
1.  Click on **WP File Manager** in the left sidebar.
2.  You will see your website's files. Look for the main folder (usually called `public_html`).
3.  **Right-click** in an empty space inside `public_html` and select **New Folder**.
4.  Name it `accounts` (or `manager`, `hms` - whatever you prefer).
5.  Open that new `accounts` folder.
6.  **Drag and drop** your `PersonalAccountsManager_Setup.zip` file into this area.
7.  **Right-click** the uploaded zip file and select **Extract Files Here**.
8.  (Optional) You can delete the `.zip` file after extracting.

## Step 4: Run It!
You have two options to use it:

### Option A: Direct Link (Full Screen)
Simply type this URL in your browser:  
`https://yourwebsite.com/accounts/index.html`

### Option B: Embed inside a WordPress Page
1.  Go to **Pages** > **Add New**.
2.  Title it "Accounts Manager".
3.  Click the **`+`** button to add a block and search for **"Custom HTML"**.
4.  Paste the following code:
    ```html
    <iframe src="/accounts/index.html" style="width: 100%; height: 800px; border: none;"></iframe>
    ```
5.  **Publish** the page.

Now you can visit that page and use your app directly inside your WordPress site! 🚀
