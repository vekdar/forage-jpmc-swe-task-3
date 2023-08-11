import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float', //required to calculate ratio
      price_def: 'float', //required to calculate ratio
      ratio: 'float', //to track two stocks' ratio rather than distinguishing between two stocks
      timestamp: 'date', //the data we are tracking is with respect to time
      upper_bound: 'float', //required to track when bounds are crossed
      lower_bound: 'float', //required to track when bounds are crossed
      trigger_alert: 'float', //the alert when upper_bound and lower_bound crosses
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line'); //the kind of graph to visualise, set to y_line
      elem.setAttribute('row-pivots', '["timestamp"]'); //responsible for x-axis, data tracked with respect to time
      //'columns' limits the datapoint's data plotted along y-axis to fields specified
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      //'aggregates' eliminates duplicate data by consolidating duplicates into single datapoint.
      //Datapoint is unique if it has timestamp; otherwise get avg of other non-unique fields that similar datapoints share
      //before treating them as one.
      elem.setAttribute('aggregates', JSON.stringify({ 
        price_abc: 'avg',
        price_def: 'avg', 
        ratio: 'avg',
        timestamp: 'distinct count', 
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
