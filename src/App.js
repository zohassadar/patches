import './App.css';
import { useState } from 'react';

const CryptoJS = require('crypto-js');
const { saveAs } = require('./bps.js');

function RomInformation({ information }) {
    return (
        <>
            <p>{information}</p>
        </>
    );
}

function SaveRom({ romFile }) {
    function downloadRom() {
        const bytes = new Uint8Array(romFile.contents.length);
        for (let i = 0; i < romFile.contents.length; i++) {
            bytes[i] = romFile.contents[i].charCodeAt(0);
        }
        saveAs(
            new Blob([bytes], { type: 'application/octet-stream' }),
            romFile.filename,
        );
    }
    if (!romFile) return;
    return (
        <>
            <button onClick={downloadRom}>download unmodified rom</button>
        </>
    );
}

function RomInput({ setInformation, setRomFile }) {
    function handleInput(event) {
        const filename = event.target.files[0].name;
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);
        reader.onload = (event) => {
            console.log(`Read ${event.target.result.length} bytes`);
            const contents = event.target.result;
            setRomFile({'contents': contents, 'filename': filename})
            const data = CryptoJS.enc.Latin1.parse(contents);
            const hash = CryptoJS.MD5(data).toString();
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
    const [romFile, setRomFile] = useState(null);
    return (
        <div className="App">
            <header className="App-header">
                <p>get md5</p>
                <RomInput setInformation={setInformation} setRomFile={setRomFile} />
                <RomInformation information={information} />
                <SaveRom romFile={romFile} />
            </header>
        </div>
    );
}

export default App;
