import './App.css';
import { useState } from 'react';

const CryptoJS = require('crypto-js');

function RomInformation({ information }) {
    return (
        <>
            <p>{information}</p>
        </>
    );
}

function RomInput({ setInformation }) {
    function handleInput(event) {
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);

        reader.onload = (event) => {
            console.log(`Read ${event.target.result.length} bytes`);
            const contents = event.target.result;
            const hash = CryptoJS.MD5(
                CryptoJS.enc.Latin1.parse(contents),
            ).toString();
            setInformation(hash);
        };
    }
    return (
        <>
            <input name="romUpload" type="file" onInput={handleInput} />
        </>
    );
}

function App() {
    const [information, setInformation] = useState('');
    return (
        <div className="App">
            <header className="App-header">
                <p>get md5</p>
                <RomInput setInformation={setInformation} />
                <RomInformation information={information} />
            </header>
        </div>
    );
}

export default App;
