import './App.css';
import { useState } from 'react';

const { saveAs, MarcFile, md5 } = require('./bps.js');

function Information({ hide, information }) {
    if (hide) return
    return (
        <>
            <p>{information}</p>
        </>
    );
}

function SaveFile({ hide, file, text }) {
    if (hide) return;
    function downloadRom() {
        saveAs(new Blob([file.contents]), file.filename);
    }
    return (
        <>
            <button onClick={downloadRom}>{text}</button>
        </>
    );
}

function FileInput({ name, handleInput, hide }) {
    if (hide) return;
    function handleFileLoad(fileEvent, filename) {
        console.log(`Read ${fileEvent.target.result.length} bytes`);
        const contents = fileEvent.target.result;
        const bytes = new Uint8Array(contents.length);
        for (let i = 0; i < contents.length; i++) {
            bytes[i] = contents[i].charCodeAt(0);
        }
        handleInput({ filename: filename, contents: bytes });
    }

    function _handleInput(event) {
        const filename = event.target.files[0].name;
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);
        reader.onload = (fileEvent) => handleFileLoad(fileEvent, filename);
    }
    return (
        <>
            <input name={name} type="file" onInput={_handleInput} />
        </>
    );
}

function App() {
    const [rom, setRom] = useState(null);
    const [patch, setPatch] = useState(null);
    const [patched, setPatched] = useState(null);

    const [romInfo, setRomInfo] = useState('');
    const [patchInfo, setPatchInfo] = useState('');

    function handleRomInput(romFile) {
        setRom(romFile);
        const hash = md5(romFile.contents).toString();
        setRomInfo(hash);
    }

    function handlePatchInput(patchFile) {
        setPatch(patchFile);
        setPatchInfo(`${patchFile.contents.length} bytes`);
        setPatched({
            filename: 'notyet.nes',
            contents: new Uint8Array([0, 1, 2]),
            valid: true,
        });
    }

    return (
        <div className="App">
            <header className="App-header">
                <Information hide={false} information="give rom" />
                <FileInput name="RomInput" handleInput={handleRomInput} />
                <Information hide={!rom} information={romInfo} />
                <SaveFile
                    hide={!rom}
                    file={rom}
                    text="download unmodified rom"
                />
                <Information hide={!rom} information="give patch" />
                <FileInput
                    name="PatchInput"
                    handleInput={handlePatchInput}
                    hide={!rom}
                />
                <Information hide={!patch} information={patchInfo} />
                <SaveFile
                    hide={!patch}
                    file={patch}
                    text="download unmodified patch"
                />
                <SaveFile
                    hide={!rom || !patch || !patched.valid}
                    file={patched}
                    text="download patched"
                />
            </header>
        </div>
    );
}

export default App;
