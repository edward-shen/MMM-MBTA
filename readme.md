![Example of MMM-MBTA](./example_picture.png)

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
        header: "MBTA:",
        config: {
            apikey: 'your_api_key',
        }
    }
]
```

## Configuration options

Option|Description
------|-----------
`apikey`|You must specify the api key given by the MBTA.
`updateInterval`|Time between updates, in seconds. Min Value: 10.
`baseUrl`|The base url of the MBTA api. You shouldn't change this unless the MBTA moved the api to the new location, and the update hasn't been reflected in this module.
`stations`|This is an array of stations that you wish to display. Currently, only one max station is allowed. For a list of station names, please refer to `stations-formatted.json`. Make sure to use the common name!<br/>Example: `stations: [ "Airport" ],`

More options will be added as this module becomes feature-rich.

## Planned Features
- [x] Options to display minutes and seconds vesus just seconds
- [ ] Options to display full description name
- [ ] Options to display arrival time
- [ ] Options to filter various modes of transportation
- [ ] Formatting that matches the default modules
- [ ] Alert tickers
- [ ] Fade effect
- [x] Animations
- [ ] Cap on maximum amount of vehicles displayed

This list was last updated on 2017-06-14.

## Known Bugs
- On boot up, it takes a very long time to diplay your options

  This can be fixed by setting up a reciever for the system notification `DOM_OBJECTS_CREATED` and start our update loop from there

- Other modes of transportations are currently unsupported!

  Please open up an issue if you see a question mark! Make sure to note what transportation type it should be (e.g. subway or bus) if possible, and please make sure to note what the text said (e.g. Back Bay)!

This list was last updated on 2017-06-13.

[mbta dev portal]: http://realtime.mbta.com/Portal/
