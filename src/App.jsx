import React, { useState, useRef, useEffect } from 'react';

// Чистый CSS прямо в компоненте. Никаких внешних библиотек.
// Максимальная автономность и минимализм.
const styles = `
  * { box-sizing: border-box; }
  .app-container {
    min-height: 100vh;
    background-color: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Courier New', Courier, monospace;
    user-select: none;
    padding: 16px;
  }
  .calculator {
    width: 100%;
    max-width: 340px;
    background-color: #0a0a0a;
    border: 1px solid #333;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 40px rgba(0, 255, 0, 0.05);
  }
  .display {
    padding: 24px 20px 16px;
    background-color: #050505;
    border-bottom: 1px solid #222;
    text-align: right;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .history-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    background: transparent;
    border: none;
    color: #555;
    cursor: pointer;
    font-size: 20px;
    transition: color 0.2s;
  }
  .history-btn:hover { color: #0f0; }
  .prev-value {
    color: #555;
    font-size: 14px;
    min-height: 20px;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .curr-value {
    color: #0f0;
    font-size: 44px;
    word-break: break-all;
    line-height: 1;
  }
  .error-text { color: #f00; }
  .cursor {
    animation: blink 1s step-end infinite;
    opacity: 0.5;
  }
  @keyframes blink { 50% { opacity: 0; } }
  
  .history-panel {
    position: absolute;
    top: 140px;
    left: 0;
    width: 100%;
    background-color: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #333;
    z-index: 10;
    display: flex;
    flex-direction: column;
    transition: max-height 0.3s ease-out;
    overflow: hidden;
  }
  .history-content {
    padding: 16px;
    overflow-y: auto;
    max-height: 240px;
  }
  .history-item {
    text-align: right;
    border-bottom: 1px solid #222;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .history-eq { color: #555; font-size: 12px; }
  .history-res { color: #0f0; font-size: 18px; }
  .history-close {
    width: 100%;
    background-color: #1a1a1a;
    color: #777;
    border: none;
    padding: 10px;
    cursor: pointer;
    font-size: 14px;
  }
  .history-close:hover { background-color: #222; color: #0f0; }
  
  /* Кастомный скроллбар для киберпанк-стиля */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #050505; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 65px;
    gap: 10px;
    padding: 16px;
    background-color: #111;
  }
  button {
    font-family: 'Courier New', Courier, monospace;
    font-size: 22px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.1s;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  button:active { transform: translateY(2px); border-bottom-width: 1px !important; margin-top: 2px; }
  
  .btn-default { background-color: #222; color: #0f0; border-bottom: 3px solid #000; }
  .btn-default:hover { background-color: #2a2a2a; }
  
  .btn-operator { background-color: #1a2a3a; color: #0ff; border-bottom: 3px solid #0a1a2a; }
  .btn-operator:hover { background-color: #23374d; }
  
  .btn-action { background-color: #3a1a1a; color: #f44; border-bottom: 3px solid #2a0a0a; }
  .btn-action:hover { background-color: #4d2323; }
  
  .btn-equal { background-color: #0a0; color: #000; border-bottom: 3px solid #050; font-weight: bold; }
  .btn-equal:hover { background-color: #0c0; }
`;

export default function App() {
  const [currentValue, setCurrentValue] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isNewInput, setIsNewInput] = useState(true);

  const historyEndRef = useRef(null);

  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  const handleNumber = (num) => {
    if (currentValue === 'Ошибка') clearAll();
    if (isNewInput) {
      setCurrentValue(num);
      setIsNewInput(false);
    } else {
      if (currentValue.length < 15) {
        setCurrentValue(currentValue === '0' ? num : currentValue + num);
      }
    }
  };

  const handleDot = () => {
    if (currentValue === 'Ошибка') clearAll();
    if (isNewInput) {
      setCurrentValue('0.');
      setIsNewInput(false);
    } else if (!currentValue.includes('.')) {
      setCurrentValue(currentValue + '.');
    }
  };

  const handleOperator = (op) => {
    if (currentValue === 'Ошибка') return;
    if (operator && !isNewInput) {
      const result = calculate(previousValue, currentValue, operator);
      setPreviousValue(String(result));
      setCurrentValue(String(result));
    } else {
      setPreviousValue(currentValue);
    }
    setOperator(op);
    setIsNewInput(true);
  };

  const calculate = (a, b, op) => {
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    if (isNaN(num1) || isNaN(num2)) return 0;

    let res = 0;
    switch (op) {
      case '+': res = num1 + num2; break;
      case '-': res = num1 - num2; break;
      case '×': res = num1 * num2; break;
      case '÷': 
        if (num2 === 0) return 'Ошибка';
        res = num1 / num2; 
        break;
      default: return num2;
    }
    return Math.round(res * 10000000000) / 10000000000;
  };

  const handleEqual = () => {
    if (!operator || !previousValue || isNewInput) return;
    const result = calculate(previousValue, currentValue, operator);
    
    const equation = `${previousValue} ${operator} ${currentValue}`;
    setHistory(prev => [...prev, { equation, result }]);
    
    setCurrentValue(String(result));
    setPreviousValue(null);
    setOperator(null);
    setIsNewInput(true);
  };

  const handleDelete = () => {
    if (isNewInput || currentValue === 'Ошибка') return;
    if (currentValue.length === 1) {
      setCurrentValue('0');
      setIsNewInput(true);
    } else {
      setCurrentValue(currentValue.slice(0, -1));
    }
  };

  const clearAll = () => {
    setCurrentValue('0');
    setPreviousValue(null);
    setOperator(null);
    setIsNewInput(true);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <div className="calculator">
          
          <div className="display">
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="История"
            >
              ⌚
            </button>
            <div className="prev-value">
              {previousValue} {operator} {operator && !isNewInput ? currentValue : ''}
            </div>
            <div className={`curr-value ${currentValue === 'Ошибка' ? 'error-text' : ''}`}>
              {currentValue}
              <span className="cursor">_</span>
            </div>
          </div>

          <div 
            className="history-panel" 
            style={{ maxHeight: showHistory ? '300px' : '0px' }}
          >
            <div className="history-content">
              {history.length === 0 ? (
                <div style={{ color: '#555', textAlign: 'center', marginTop: '20px' }}>Логи пусты...</div>
              ) : (
                history.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-eq">{item.equation}</div>
                    <div className="history-res">{item.result}</div>
                  </div>
                ))
              )}
              <div ref={historyEndRef} />
            </div>
            <button className="history-close" onClick={() => setShowHistory(false)}>
              ▼ ЗАКРЫТЬ
            </button>
          </div>

          <div className="keypad">
            <button className="btn-action" onClick={clearAll}>C</button>
            <button className="btn-action" onClick={handleDelete}>⌫</button>
            <button className="btn-operator" onClick={() => handleOperator('÷')}>÷</button>
            <button className="btn-operator" onClick={() => handleOperator('×')}>×</button>

            <button className="btn-default" onClick={() => handleNumber('7')}>7</button>
            <button className="btn-default" onClick={() => handleNumber('8')}>8</button>
            <button className="btn-default" onClick={() => handleNumber('9')}>9</button>
            <button className="btn-operator" onClick={() => handleOperator('-')}>-</button>

            <button className="btn-default" onClick={() => handleNumber('4')}>4</button>
            <button className="btn-default" onClick={() => handleNumber('5')}>5</button>
            <button className="btn-default" onClick={() => handleNumber('6')}>6</button>
            <button className="btn-operator" onClick={() => handleOperator('+')}>+</button>

            <button className="btn-default" onClick={() => handleNumber('1')}>1</button>
            <button className="btn-default" onClick={() => handleNumber('2')}>2</button>
            <button className="btn-default" onClick={() => handleNumber('3')}>3</button>
            <button className="btn-equal" style={{ gridRow: 'span 2' }} onClick={handleEqual}>=</button>

            <button className="btn-default" style={{ gridColumn: 'span 2' }} onClick={() => handleNumber('0')}>0</button>
            <button className="btn-default" onClick={handleDot}>.</button>
          </div>

        </div>
      </div>
    </>
  );
}