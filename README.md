# CKEditor 4 Bender Runner

The aim of this project is to allow running CKEditor 4 Bender tests automatically in any browser without the need to modify bender itself 😰

## But why?

Bender is really advanced project and powerful test runner. However, as it was abandoned long time ago it doesn't make sense to try to resurrect it. Still, CKEditor 4 which uses it has a significant amount of development ahead and lack of automation makes it really painful. So if we can find a quick and easy way to make it work it will be fabulous.

## Inspiration

Looking at how we use Bender on day-to-day basics when reviewing PRs makes you think that it can be easily automated. We just launch the browser, paste the URL with test path/filters and click run button. Then wait a while and go to another browser. Seems like any script can do that right?

## How does it work?

It consists of two main parts - frontend runner and backend runner.

### Frontend runner

Frontend runner is just simple html file (see `src/runner.html`) which gets injected into bender NPM package during runtime. It lands in `ckeditor4/node_modules/benderjs/static/runner.html`. Since this directory is used to serve static files it works out-of-the-box (without any changes in bender itself). So after running bender with this file injected, one can go to `http://loclahost:1030/runner.html` and see file contents without any changes.

After runner is opened in the browser it reads URL hash contents (at the moment, backend runner port and tests query is held there) and then creates an iframe with URL pointing to bender URL. This means opening:

```
http://loclahost:1030/runner.html#port:1031,is:unit,path:/tests/plugins/image2
```

will result in embedded iframe pointing to `http://loclahost:1030/#is:unit,path:/tests/plugins/image2` which is simply a bender main view with unit tests filtered to be `unit` and `image2` only.

Since both runner and embedded bender iframe have the same origin (`localhost:1030`), runner can access all iframe contents which means it can also access full bender API and control it. And that's the next step - after iframe is done loading and bender is ready, runner checks if tests are running - and if not they are started with simple bender start button click (probably bender API should be used here too 🤔🙈).

The last thing it does, on every test run, runner sends its status (or rather entire metadata provided by bender) to backend runner (here is the port passed in URL hash used) - so in the above case it will be `http://localhost:1031`.

### Backend runner

Backend runner is the main script here which launches the entire testing procedure. On the high level what is does is:

* Inject frontend runner (`runner.html`) into bender NPM deps.
* Launch bender.
* Launch server.
* Launch browser instance with given URL pointing to frontend runner.
    * Wait for test run to finish.
* Launch another browser instance (based on config)
    * Wait for test run to finish...
* Exit script when done (or on error).

**One important thing** is that backend runner assumes there is CKEditor 4 directory (with node dependencies already installed) available in `./ckeditor4` folder (however this can be changed via config file see `bender-runner.config.json`).

#### Inject frontend runner

The `src/runner.html` file is copied to `ckeditor4/node_modules/benderjs/static/runner.html`. That's it.

#### Launch bender

The `npm run sub:bender` NPM script is run. See `src/bender.js`. What it does, it just `cd`s into CKEditor 4 directory and runs `bender server run -p $PORT -H 0.0.0.0` which launches bender instance.

#### Launch server

It is very simple server (see `src/server.js`) written in nodejs (`fastify` used) which receives and prints test information send by frontend runner. It is launched via `npm run sub:server` NPM script. For now it is one way communication - so bender run in browser sends tests results here, but could be used for two way communication too (not needed now, since I really don't want to complicate this solution). Yes, sockets can be used here to, but again - KISS.

#### Launch browser instance

This is the point, where testing starts. Browser instance is launched (based on the config and OS - Browser matrix, see `bender-runner.config.json`), using `launchpad`, with the URL pointing to frontend runner. Runner takes care of running tests and sending tests results to the server (launched in a previous step).

If there are few browsers to be launched, one is launched after tests in the previous one are finished.

## Benefits

* It just works (tm) without touching bender.
* Decoupled bender from controlling browser - this means any software which can launch given browser with a specific URL can be used here (yes, BrowserStack or similar things with a proper API too).

## Development

_Please keep in mind, that this is PoC. It was done after hours with a simple target in mind - to have something working as fast as possible. It works but the code itself would love some polishing. OTOH I would like to keep it as simple as possible without complicating the flow too much_.

To test how it works:

1. Checkout this repository and install NPM dependencies:

```bash
git clone git@github.com:ckeditor/ckeditor4-benderjs-runner.git
cd ckeditor4-benderjs-runner
npm i
```

2. Checkout CKEditor 4 repo and install its NPM dependencies:

```bash
git clone git@github.com:ckeditor/ckeditor4.git
cd ckeditor4
npm i
```

_You can also change `bender-runner.config.json` config `paths.ckeditor4` property to point to your current CKEditor 4 directory instead of cloning `ckeditor4` repository_.

3. Go back to main repo dir and run:

```bash
npm run test '../bender-runner.config.json' 'path:/tests/plugins/image2'
```

This will run `image2` unit tests in all browser defined in config file available in your OS.

---

Additionally, 3rd parameter can be passed specifying single browser only on which to run tests, for example:

```bash
npm run test '../bender-runner.config.json' 'path:/tests/plugins/image2' 'chrome'
```

With such call, even though more browsers may be available on host OS and config may have multiple names listed, tests will be run only on this single browser.

## What's next?

1. Script for checking changes based on git diff and running only affected tests.
1. Integrate with GH Actions/Workflows.
1. Closing browser instances correctly.
1. Integration with BrowserStack (API is there, we also need tunneling here - BS has it or use e.g. `ngrok`).

### 1. Script for checking changes based on git diff and running only affected tests.

It can greatly decrease CI run times (as we don't want to run all tests each time). For PRs it should be easy since GH provides a way to get PR target branch (so diffing all changes is easy), for branches (not yet PRs) we could compare against main branches (so `master` and `major` - should be defined in config) and assume that target branch is the one which has less changes against. For commits pushed directly to main branches (so `master` and `major` - again should be configurable) we could only get changes from latest commit (which will basically cover all PR changes for merge commits) and also do full runs only once in a while (e.g. on a daily basis).

### 2. Integrate with GH Actions/Workflows.

There are [Linux, macOS and Windows images available](https://docs.github.com/en/free-pro-team@latest/actions/reference/specifications-for-github-hosted-runners#supported-runners-and-hardware-resources) so I assume at least Chrome, Firefox, Edge, Safari and IE11 can be covered here. For IE8-IE10 and mobiles (so Chrome@Android and Safari@iOS) we will need integration with BrowserStack (or similar service).

Since GH Actions allows matrix runs it will be easier to define - I'm not only sure if such steps run simultaneously (that would be faster) or one after another.

### 4. Integration with BrowserStack.

I have tested it one day and it seems to be doable AFAIR. The only issue could be with IE8 which displays alert about long executing script for bender and I'm not sure if it can be somehow disabled.
