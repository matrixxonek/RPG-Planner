import 'tailwindcss';

interface FormDisplayProps{
    onClose: () => void;
    onSubmit: () => void;
}

function FormDisplay(props: FormDisplayProps){

    return(
        <div className='absolute content-center align-middle w-3xl h-full bg-amber-300'>
            <button onClick={props.onClose}>Anuluj</button>
            <button onClick={props.onSubmit}>Zapisz</button>
        </div>  
    );
}

export default FormDisplay;