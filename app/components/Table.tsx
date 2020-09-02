import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { useTable, useBlockLayout, useResizeColumns } from 'react-table';
import { FixedSizeList } from 'react-window';

const listMaxHeight = 180;
const tableMaxWidth = 500;
const Styles = styled.div`
  .table {
    display: inline-block;
    border-spacing: 0;
    border: 1px solid white;

    .tr {
      :last-child {
        .td {
          border-bottom: 0;
        }
      }
    }

    .th,
    .td {
      margin: 0;
      padding: 2px;
      border-bottom: 1px solid white;
      border-right: 1px solid white;
      line-height: 20px;
      font-size: 14px;
      text-align: center;
      ${'' /* In this example we use an absolutely position resizer,
       so this is required. */}
      position: relative;

      :last-child {
        border-right: 0;
      }
      input {
        font-size: 14px;
        padding: 0;
        margin: 0;
        border: 0;
        width: 100%;
        text-align: center;
      }
      .resizer {
        display: inline-block;
        background: #72c0ff;
        width: 2px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${'' /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;
        user-select: none;
        &.isResizing {
          background: red;
        }
      }
    }
  }
`;

// const updateMyData = (rowIndex, columnId, value) => {
//   // We also turn on the flag to not reset the page
//   setSkipPageReset(true)
//   setData(old =>
//     old.map((row, index) => {
//       if (index === rowIndex) {
//         return {
//           ...old[rowIndex],
//           [columnId]: value,
//         }
//       }
//       return row
//     })
//   )
// }

// Create an editable cell renderer
const EditableCell = ({
  value: initialValue,
  row: { index },
  column: { id },
  // updateMyData, // This is a custom function that we supplied to our table instance
}) => {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue);

  const onChange = (e) => {
    // setValue(e.target.value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return <input value={value} disabled onChange={onChange} />;
};

function TableLayOut({ columns, data = [] }) {
  const defaultColumn = useMemo(
    () => ({
      minWidth: 30,
      width: 210,
      maxWidth: tableMaxWidth,
      Cell: EditableCell,
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    totalColumnsWidth,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useBlockLayout,
    useResizeColumns
  );

  const RenderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];
      prepareRow(row);
      return (
        <div
          {...row.getRowProps({
            style,
          })}
          className="tr"
        >
          {row.cells.map((cell) => {
            return (
              <div {...cell.getCellProps()} className="td webkit-ellipsis">
                {cell.render('Cell')}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows]
  );

  return (
    <div {...getTableProps()} className="table">
      <div>
        {headerGroups.map((headerGroup) => (
          <div {...headerGroup.getHeaderGroupProps()} className="tr">
            {headerGroup.headers.map((column) => (
              <div {...column.getHeaderProps()} className="th">
                {column.render('Header')}
                {/* Use column.getResizerProps to hook up the events correctly */}
                <div
                  {...column.getResizerProps()}
                  className={`resizer ${
                    column.isResizing ? 'isResizing' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div {...getTableBodyProps()}>
        <FixedSizeList
          height={listMaxHeight}
          itemCount={rows.length}
          itemSize={25}
          width={totalColumnsWidth}
          style={{ maxHeight: listMaxHeight }}
        >
          {RenderRow}
        </FixedSizeList>
      </div>
    </div>
  );
}

function Table(props: Props) {
  const columns = useMemo(
    () => [
      {
        Header: 'Path',
        accessor: 'path',
      },
      {
        Header: 'SavedPath',
        accessor: 'savedPath',
      },
      {
        Header: 'Status',
        accessor: 'status',
      }
    ],
    []
  );

  const { data } = props;

  return (
    <Styles>
      <TableLayOut columns={columns} data={data} />
    </Styles>
  );
}

export default Table;
