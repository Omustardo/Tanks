Tanks
=======
Demo of TypeScript + Node.js + Socket.io in Visual Studio

Deals with using CommonJS and AMD/Require.js together in the same Visual Studio project which I didn't find any existing solution for.

This is a reimplementation of https://github.com/rubentd/tanks

### Code Structure
The basic idea is that there the server code is written in the root directory (minus the bin folder) and client code is written in the public folder. When the typescript is compiled, it's redirected depending on whether it's for the server or client. All client stuff goes to bin/client and server goes to bin/server. There are also static assets (images, js libraries, etc) in server/static_assets

  * bin/client/public/js - Javascript files referenced in the webpage. 
    This route is set in app.ts:
    `app.use("/js", express.static(path.join(__dirname, '../client/public/js')));`
    which allows the HTML to reference them with: /js/<filename>
  * bin/client/public/js/client.js - The main file for the client. This is specified in the require.js script tag in bin/server/static_assets/views/index.jade
  
  * bin/server/app.js - The 'main' file for the server. This file is specified in package.json as being the starting location.
  * bin/server/static_assets - Files for serving. These can be referenced from HTML. The route is set in app.ts: 
    `app.use("/static_assets", express.static(path.join(__dirname, 'static_assets')));`
  * bin/server/static_assets/views/index.jade - This is a template that is rendered and served as a html document by bin/server/routes/index.js
    The reference to this file is set in app.ts:
    `app.set('views', path.join(__dirname, './static_assets/views'));`
    Note this only works because app.ts is set to compile to bin/server/app.js and the path is relative to that.

  * public - Typescript for the client
  * routes - Server code to respond to specific requests. In this case it just serves index.jade from bin/server/static_assets/views/index.jade
  * Scripts/typings - .d.ts files: these are header files that let typescript use existing javascript libraries by redeclaring the function headers with data types.
    Note that these files 'declare' so any typescript files can see the functions they declare without importing. They are just headers though so if you don't include the javascript that they're based on, they don't do anything. Also be careful since they are often not up to date with current versions of libraries so the headers can be wrong.
  * public - Root directory for files served to the client.
  * public/js/alert.ts - sample to show importing from another file. This is imported both by public/client.ts (client code) but also in app.ts (server).
  * routes - Used to render jade templates into html and serve them to the client
  * views - jade files that can be turned into html
  * app.ts - the server logic

All of the files in bin/server and bin/client are generated except those in bin/server/static_assets. If something is acting strangely, try deleting everything else in bin/ and rebuilding.


### Getting this working locally
  * Install VS2015 Community. Use custom installation to also install Github for VS in the Common Tools section (Github not required, but handy for development).
  * Restart computer (required for VS installation)
  * Install Node.js Tools "NTVS". I am using version 1.1
  Download Link: https://www.visualstudio.com/en-us/features/node-js-vs.aspx
  At the end of the NTVS installation there's a link to install Node.js. Click it unless you already have Node installed.
  I installed v0.12.7 x64
  * Open visual studio and sign in with your microsoft account. Decline hosting the project in the cloud
  * At this point the installation parts are complete. You should be able to create a working client/server nodejs/typescript project by: File->New Project->Templates->Other Languages->TypeScript->Basic Azure Node.js Express 3 Application

  * Now to get this project loaded
  * Download this repository & unzip. https://github.com/Omustardo/Tanks/archive/master.zip
    It will save a tiny bit of effort if you unzip it into your C drive. So the structure would be: C:\tanks-master\Tanks.sln
  * Run Tanks.sln
  * In the Solution Explorer, right click "npm" and "Install Missing npm packages"
  * Now you have all of the source code, but you need to build/compile it. If you didn't unzip to C:\ you need to change the build path. 
  To change the build path, go to Project -> TypeScript Build and modify the javascript output to go to <your path>\bin\server
  and then switch the Configuration to Client and change that js output path to <your path>\bin\client
  ![js output path](https://cloud.githubusercontent.com/assets/7197679/12866359/2318d1fa-cc80-11e5-8e9f-ec04e0660288.PNG)
  * To build, you can manually do each target by selecting server and clicking build, and then selecting client and clicking build.
  ![client server build](https://cloud.githubusercontent.com/assets/7197679/12866358/2318d024-cc80-11e5-83ac-fe5747077500.PNG)
  * The easier way in the long run is to make a custom button to do both.
  Make a new button:
  ![custom button1](https://cloud.githubusercontent.com/assets/7197679/12866362/23297780-cc80-11e5-9c54-e71fd72c1173.PNG)
  ![custom button2](https://cloud.githubusercontent.com/assets/7197679/12866361/23195e90-cc80-11e5-9adb-a3f4ee556f15.PNG)
  Click it and make sure it looks like this, and then press build:
  ![custom button3](https://cloud.githubusercontent.com/assets/7197679/12866356/2316e1d8-cc80-11e5-8f77-59f649033aa4.PNG)
  * Now press the green play button to run it. I recommend Google Chrome, but any modern browser should work.
  * A terminal should pop up with logging information. Go to localhost:1337 and your game should load. 
  * You can load multiple browser tabs as well as accessing it from other computers (including cell phones) on your local network. You should be able to connect to your computer as long as you know its local IP. On windows you can find this through the command prompt with the command ipconfig. For me it was in the output section "Ethernet adapter Ethernet" IPv4 Address. It should be something like 192.168.1.5. So from your cell phone browser you'd enter: 192.168.1.5:1337


### Misc info
  * The server and client must be built separately due to javascript's import specifications. There are a variety of ways to import from other files, but the most popular are CommonJS and AMD(implemented with require.js). Node.js uses CommonJS built in, but AMD is better for clients because it's asynchronous. In order to allow the client and server to use their preferred importing style, we have to compile the typescript separately for each, outputting in the specified format.
  * Sometimes I get import 'not working'. It goes away just as randomly and doesn't actually cause any issue with running the code so I don't worry about it.
    ![import not working](https://cloud.githubusercontent.com/assets/7197679/12866357/2318d1e6-cc80-11e5-8d3f-ffee209cd9e7.PNG)
  * Note that javascript tutorials dealing with multiple imports talk about different import syntax for CommonJS vs Require.js. This is not relevant to Typescript. The typescript compiler lets you use either format and compiles them into whichever format you tell it to (in Project -> Properties -> TypeScript)
   ![two types of imports both work - typescript compiles them down](https://cloud.githubusercontent.com/assets/7197679/12866360/23191e08-cc80-11e5-985c-6fa036fef0d0.PNG)
