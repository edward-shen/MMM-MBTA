# MMM-MBTA

This MagicMirror² Module is designed to pull information from the Massachusetts Bay Transportation Authority's API and to
show and filter data.

For this to work, you need to create your own MBTA API key. You can get one by following [this link][mbta dev portal] and 
signing up. Note that it may take up to a day to approve your api key, according to their website.

## Installation

In your terminal, go to your MagicMirror's Module folder:

```bash
cd ~/MagicMirror/modules
```
Clone this repository:
```bash
git clone https://github.com/edward-shen/MMM-MBTA.git
```
Configure the module in your config.js file.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
```js
modules: [
    {
        module: 'MMM-MBTA',
        position: 'top_right', // This can be any of the regions.
        config: {
            apiKey: 'your_api_key',
        }
    }
]
```

## Configuration options

Option|Description
------|-----------
`test`|Does something

[mbta dev portal]: http://realtime.mbta.com/Portal/
