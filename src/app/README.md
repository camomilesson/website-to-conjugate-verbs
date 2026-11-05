# Application shell

Owns the entry point, data-router routes, navigation, document titles, route
focus, and global newspaper theme. Feature views are imported through module
public APIs. Unknown URLs redirect to /practice; browser history and direct
links are supported. A data router enables practice to block in-app navigation
with a confirmation dialog while a session is active. Production hosting must serve index.html for app routes
(configured in deployment step 2). Fonts use installed Georgia/Times and Courier
fallbacks, without remote font requests.
