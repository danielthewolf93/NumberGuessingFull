import beaker
import pyteal as pt
import random


class PogadjanjeState:
    skriveni_broj = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    rezultat = beaker.LocalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    brojac = beaker.LocalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))


app = beaker.Application("Pogadjanje", state=PogadjanjeState)


@app.create(bare=True)  # bare = True označava da funkcija ne prima ni jedan parametar
def create() -> pt.Expr:
    return app.initialize_global_state()


@app.opt_in(bare=True)
def opt_in() -> pt.Expr:
    return pt.Approve()


@app.external
def zapocni_igru(*, output: pt.abi.String) -> pt.Expr:
    return pt.Seq(
        app.state.skriveni_broj.set(pt.Int(random.randint(1, 10))),
        output.set("Namesten je skriveni broj. Srecno sa pogadjanjem!"),
    )


@app.external
def pogodi(
    uplata: pt.abi.PaymentTransaction, broj: pt.abi.Uint64, *, output: pt.abi.String
) -> pt.Expr:
    pt.Assert(uplata.get().receiver() == pt.Global.current_application_address()),

    return pt.Seq(
        pt.If(app.state.skriveni_broj.get() == broj.get())
        .Then(
            pay(pt.Txn.sender(), uplata.get().amount() * pt.Int(5)),
            app.state.rezultat.set(pt.Int(1)),
            promeni_broj(),
        )
        .Else(app.state.rezultat.set(pt.Int(0))),
    )


@app.external
def rezultat_igre(*, output: pt.abi.String) -> pt.Expr:
    return pt.Seq(
        pt.If(app.state.rezultat == pt.Int(1))
        .Then(output.set("Pogodak! Novac je uplacen na racun."))
        .Else(output.set("Promasaj! Probaj drugi broj."))
    )


@pt.Subroutine(pt.TealType.none)
def pay(receiver: pt.Expr, amount: pt.Expr) -> pt.Expr:
    return pt.InnerTxnBuilder.Execute(
        {
            pt.TxnField.type_enum: pt.TxnType.Payment,
            pt.TxnField.fee: pt.Int(1000),
            pt.TxnField.amount: amount,
            pt.TxnField.receiver: receiver,
        }
    )


@pt.Subroutine(pt.TealType.none)
def promeni_broj() -> pt.Expr:
    return pt.Seq(
        pt.For(
            app.state.brojac.set(pt.Int(0)),
            app.state.brojac.get() < pt.Int(random.randint(1, 10)),
            app.state.brojac.increment(),
        ).Do(app.state.skriveni_broj.increment()),
        pt.If(app.state.skriveni_broj > pt.Int(10)).Then(
            app.state.skriveni_broj.set(app.state.skriveni_broj.get() - pt.Int(10))
        ),
        app.state.brojac.set(pt.Int(0)),
    )


@app.external
def hello(name: pt.abi.String, *, output: pt.abi.String) -> pt.Expr:
    return output.set(pt.Concat(pt.Bytes("Hello, "), name.get()))
