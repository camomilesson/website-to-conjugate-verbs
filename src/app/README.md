# Application shell

Owns the entry point, BrowserRouter routes, navigation, document titles, route
focus, and global newspaper theme. Feature views are imported through module
public APIs. Unknown URLs redirect to /practice; browser history and direct
links are supported. Production hosting must serve index.html for app routes
(configured in deployment step 2). Fonts use installed Georgia/Times and Courier
fallbacks, without remote font requests.
