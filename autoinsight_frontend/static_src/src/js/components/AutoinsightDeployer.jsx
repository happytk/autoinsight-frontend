/* eslint-disable camelcase */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useGet, useMutate } from 'restful-react';
import SafeSrcDocIframe from 'react-safe-src-doc-iframe';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';

const PredictionResult = ({
  inputs,
  result,
  lime,
  // errors,
}) => {
  if (!inputs || !result || !lime) {
    return null;
  }

  return (
    <>
      {
        // inputs.map((e, idx) => (
        //   <div key={idx}>
        //     {e}
        //     {errors[idx] ? <span style={{ color: 'red' }}>{errors[idx]}</span> : result[idx]}
        //   </div>
        // ))
      }
      <h2 style={{ paddingTop: '50px', paddingBottom: '20px' }}>
        예측값:
        {' '}
        {result.map((e) => e)}
      </h2>
      {
        lime && lime.asHtml ? (
          <SafeSrcDocIframe
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            srcDoc={lime.asHtml}
            border="0"
            title="helloworld"
            width="100%"
            height="400"
            style={{ border: '0' }}
          />
        ) : null
      }
    </>
  );
};

PredictionResult.propTypes = {
  inputs: PropTypes.any,
  result: PropTypes.any,
  lime: PropTypes.object,
  // errors: PropTypes.array,
};

const PredictForm = ({ predictUrl }) => {
  const { data, loading } = useGet({
    path: g_RESTAPI_HOST_BASE + 'dataset/columns/',
  });
  const mutateObj = useMutate({
    verb: 'POST',
    path: predictUrl,
  });
  const [predictResult, setPredictResult] = useState(null);
  const [singleData, setSingleData] = useState({});
  const fillMedian = () => {
    const d = {};
    data.filter((col) => col.isFeature).forEach((col) => {
      console.log(col.name, col.mean, col.mostFrequent)
      d[col.name] = col.mean || col.mostFrequent; });
    setSingleData(d);
    // console.log(d);
  };
  const setPredictionInput = (key, value) => {
    const d = { ...singleData };
    d[key] = value;
    setSingleData(d);
    // console.log(d);
  };
  const singlePredict = () => {
    // predict({variables: })
    const inputs = data.filter((col) => col.isFeature).map((col) => singleData[col.name]).join(',');
    mutateObj.mutate({ inputs }).then((r) => {
      // console.dir(r);
      setPredictResult(r);
    });
  };

  if (loading) return 'loading...';

  return (
    <>
      <div className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">데이터 예측하기</h3>
        </div>
        <div className="panel-body">
          <div className="alert alert-danger" role="alert">
            <h4>이 폼에 대한 데이터 처리는 RestAPI URL로 열려있습니다.</h4>
            <table className="table table-condensed" style={{ marginTop: '30px' }}>
              <tbody>
                <tr>
                  <td width="100px">
                    <span className="badge badge-danger">URL</span>
                  </td>
                  <td>
                    <span style={{ textDecoration: 'underline' }}>
                      {`${window.location.protocol}//${window.location.hostname}:${window.location.port}${predictUrl}`}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-danger">Method</span>
                  </td>
                  <td>
                    <b>POST</b>
                    로 접근합니다.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-danger">Input</span>
                  </td>
                  <td>
                    <b>inputs</b>
                    을 키값으로 갖는 Comma(,)로 구분된 Data를 Input으로 전달합니다.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-danger">Output</span>
                  </td>
                  <td>
                    <b>inputs</b>
                    은 호출에 사용된 입력값,
                    {' '}
                    <b>result</b>
                    예측값,
                    {' '}
                    <b>errors</b>
                    호출시 에러가 있으면 전달
                    {' '}
                    <b>lime</b>
                    예측하는데 사용한 설명자료(html)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>특성이름</th>
                <th>데이터유형</th>
                {/* <th>isFeature</th> */}
                {/* <th>isTarget</th> */}
                <th>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => fillMedian()}
                  >
                      값을 평균값으로 채우기
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                e.isFeature ? (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.datatype}</td>
                    <td>
                      {
                        e.isFeature ? (
                          <input
                            // label={e.name}
                            onChange={(ev) => setPredictionInput(e.name, ev.target.value)}
                            // helperText={e.name}
                            value={singleData[e.name] === null || singleData[e.name] === undefined ? '' : singleData[e.name]}
                            type="text"
                            className="form-control"
                          />
                        ) : null
                      }
                    </td>
                  </tr>
                ) : null
              ))}
            </tbody>
          </table>
          <button
            type="button"
            disabled={mutateObj.loading}
            onClick={() => singlePredict()}
            className="btn btn-primary btn-lg btn-block"
          >
            { mutateObj.loading ? '수행중입니다' : '예측하기' }
          </button>
          <PredictionResult {...predictResult} />
        </div>
      </div>
    </>
  );
};

PredictForm.propTypes = {
  predictUrl: PropTypes.string,
};

const PredictBulkForm = ({ predictUrl }) => {
  const { mutate, loading } = useMutate({
    verb: 'POST',
    path: predictUrl,
  });
  const [inputs, setInputs] = useState('');
  const [predictResult, setPredictResult] = useState(null);

  return (
    <>
      <div className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">데이터 예측하기(CSV)</h3>
        </div>
        <div className="panel-body">
          <textarea
            id="outlined-textarea"
            label="Prediction Form for Bulkdata"
            onChange={(e) => { setInputs(e.target.value); }}
            placeholder="csv형식의 데이터를 여러 행 붙여넣을 수 있습니다."
            className="form-control"
            rows="8"
            style={{ width: '100%' }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              mutate({ inputs }).then((r) => {
                setPredictResult(r);
              });
            }}
            className="btn btn-primary btn-lg btn-block"
          >
            {loading ? '수행중입니다' : '예측하기'}
          </button>
          <PredictionResult {...predictResult} />
        </div>
      </div>
    </>
  );
};

PredictBulkForm.propTypes = {
  predictUrl: PropTypes.string,
};

const DeployInfo = ({
  target,
  createdAt,
  exportModelUrl,
  // export_workspace_url,
}) => (
  <>
    <div className="panel panel-default">
      <div className="panel-heading">
        <h3 className="panel-title">배포기본정보</h3>
      </div>
      <div className="panel-body">
        {
          target.estimators ?
          <>
            <h2>
              {target.estimators.map(
                (est) => <div key={est}>{est}</div>,
              )}
            </h2>
            {
              target.estimators.length > 1
                ? (
                  <div style={{ marginTop: '3px', marginBottom: '8px' }}>
                    총
                    {' '}
                    <b>{target.estimators.length}</b>
                    개의 모델이 ensemble로 만들어졌습니다.
                  </div>
                ) : null
            }
          </> :
          <h2>{target.estimatorName}</h2>
        }
        <div>
          훈련된 예측 스코어:
          {' '}
          <span style={{ textDecoration: 'underline' }}>{target.score}</span>
        </div>
        <div>
          배포일자:
          {' '}
          <span style={{ textDecoration: 'underline' }}>{createdAt}</span>
        </div>
        <div style={{ marginTop: '30px' }} className="alert alert-success" role="alert">
          <a className="btn btn-danger btn-lg" href={exportModelUrl}>
            모델바이너리 내려받기
          </a>
          <div style={{ marginTop: '25px' }}>
            이 바이너리 파일은 로컬환경에서 작업할 수 있는 환경을 제공하기 위해 다운로드할 수 있습니다.
            <br />
            로컬환경에 관련 library는 설치되어 있어야 합니다. (python3.7 이상, autoinsight모듈필요.)
            <SyntaxHighlighter language="python" style={docco}>
              {`# This trained model doesn't include the preprocessor
# (will be implemented soon!)                    
import pickle
trained_model = pickle.load('downloaded_model')
trained_model.predict(X)`}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  </>
);

DeployInfo.propTypes = {
  target: PropTypes.any,
  // model_type: PropTypes.string,
  // model_pk: PropTypes.number,
  createdAt: PropTypes.any,
  exportModelUrl: PropTypes.string,
  // export_workspace_url: PropTypes.string,
};

export default () => {
  const { data, loading } = useGet({
    path: g_RESTAPI_HOST_BASE + 'deployment/',
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    data && data.target ? (
      <>
        <DeployInfo {...data} />
        <PredictForm {...data} />
        <PredictBulkForm {...data} />
      </>
    ) : <p>배포된 모델이 존재하지 않습니다.</p>
  );
};
