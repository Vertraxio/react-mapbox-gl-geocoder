import React, { Component } from "react";
import PropTypes from "prop-types";
import MapboxClient from "mapbox";
import { WebMercatorViewport } from "viewport-mercator-project";

class Geocoder extends Component {
    debounceTimeout = null;
    state = {
        results: [],
        showResults: false
    };

    onChange = event => {
        const {
            timeout,
            queryParams,
            localGeocoder,
            limit,
            localOnly
        } = this.props;
        const queryString = event.target.value;

        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            const localResults = localGeocoder
                ? localGeocoder(queryString)
                : [];
            const params = {
                ...queryParams,
                ...{ limit: limit - localResults.length }
            };

            if (params.limit > 0 && !localOnly) {
                this.client.geocodeForward(queryString, params).then(res => {
                    this.setState({
                        results: [...localResults, ...res.entity.features]
                    });
                });
            } else {
                this.setState({
                    results: localResults
                });
            }
        }, timeout);
    };
    onSelected = item => {
        const {
            viewport,
            onSelected,
            transitionDuration,
            hideOnSelect,
            pointZoom
        } = this.props;
        let newViewport = new WebMercatorViewport(viewport);
        const { bbox, center } = item;

        if (bbox) {
            newViewport = newViewport.fitBounds([
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ]);
        } else {
            newViewport = {
                longitude: center[0],
                latitude: center[1],
                zoom: pointZoom
            };
        }

        const { longitude, latitude, zoom } = newViewport;

        onSelected(
            {
                ...viewport,
                ...{ longitude, latitude, zoom, transitionDuration }
            },
            item
        );

        if (hideOnSelect) {
            this.setState({ results: [] });
        }
    };

    showResults = () => {
        this.setState({ showResults: true });
    };

    hideResults = () => {
        setTimeout(() => {
            this.setState({ showResults: false });
        }, 300);
    };

    constructor(props) {
        super();

        this.client = new MapboxClient(props.mapboxApiAccessToken);
    }

    render() {
        const { results, showResults } = this.state;
        const {
            formatItem,
            className,
            inputComponent,
            itemComponent,
            placeholder
        } = this.props;

        const Input = inputComponent || "input";
        const Item = itemComponent || "div";

        return (
            <div className={`react-geocoder ${className}`}>
                <Input
                    onChange={this.onChange}
                    onBlur={this.hideResults}
                    onFocus={this.showResults}
                    placeholder={placeholder}
                />

                {showResults && !!results.length && (
                    <div className="react-geocoder-results">
                        {results.map((item, index) => (
                            <Item
                                key={index}
                                className="react-geocoder-item"
                                onClick={() => this.onSelected(item)}
                                item={item}
                            >
                                {formatItem(item)}
                            </Item>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

Geocoder.propTypes = {
    className: PropTypes.string,
    formatItem: PropTypes.func,
    hideOnSelect: PropTypes.bool,
    inputComponent: PropTypes.func,
    itemComponent: PropTypes.func,
    limit: PropTypes.number,
    localGeocoder: PropTypes.func,
    localOnly: PropTypes.bool,
    mapboxApiAccessToken: PropTypes.string.isRequired,
    onSelected: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    pointZoom: PropTypes.number,
    queryParams: PropTypes.object,
    timeout: PropTypes.number,
    transitionDuration: PropTypes.number,
    viewport: PropTypes.object.isRequired
};

Geocoder.defaultProps = {
    className: "",
    formatItem: item => item.place_name,
    hideOnSelect: false,
    limit: 5,
    pointZoom: 16,
    queryParams: {},
    timeout: 300,
    transitionDuration: 0
};

export default Geocoder;
